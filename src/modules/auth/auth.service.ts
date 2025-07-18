import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { LoggerService } from '../../shared/logger/logger.service';
import { CacheService } from '../../shared/cache/cache.service';
import { EmailService } from '../email/email.service';
import { User } from '../users/entities/user.entity';
import { UserSession } from './entities/user-session.entity';
import { 
  LoginDto, 
  RegisterDto, 
  RefreshTokenDto, 
  AuthResponseDto,
  LogoutDto,
  UserRole 
} from './dto';
import { UserStatus } from '../users/dto/create-user.dto';
import { 
  BusinessValidationException, 
  ResourceNotFoundException,
  AuthenticationException 
} from '../../shared/exceptions/custom.exceptions';

/**
 * Payload do JWT
 */
interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Serviço de autenticação
 * 
 * @description Gerencia autenticação, autorização e sessões de usuário
 * @author NeuralContent Team
 * @since 1.0.0
 */
@Injectable()
export class AuthService {
  private readonly ACCESS_TOKEN_EXPIRY = '15m';
  private readonly REFRESH_TOKEN_EXPIRY = '7d';
  private readonly BCRYPT_ROUNDS = 12;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    
    @InjectRepository(UserSession)
    private readonly sessionRepository: Repository<UserSession>,
    
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
    private readonly cacheService: CacheService,
    private readonly emailService: EmailService,
  ) {
    this.logger.setContext('AuthService');
  }

  /**
   * Realiza login do usuário
   */
  async login(loginDto: LoginDto, clientInfo?: {
    ipAddress?: string;
    userAgent?: string;
    location?: string;
    deviceType?: string;
  }): Promise<AuthResponseDto> {
    this.logger.log(`Tentativa de login para email: ${loginDto.email}`);

    try {
      // Buscar usuário com senha
      const user = await this.userRepository.findOne({
        where: { email: loginDto.email },
        select: ['id', 'email', 'name', 'password', 'role', 'status'],
      });

      if (!user) {
        this.logger.warn(`Usuário não encontrado: ${loginDto.email}`);
        throw new AuthenticationException('Credenciais inválidas');
      }

      // Verificar status do usuário
      if (user.status !== 'active') {
        this.logger.warn(`Usuário inativo tentou fazer login: ${loginDto.email}`);
        throw new AuthenticationException(`Conta ${user.status}. Entre em contato com o suporte.`);
      }

      // Verificar senha
      const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
      if (!isPasswordValid) {
        this.logger.warn(`Senha incorreta para usuário: ${loginDto.email}`);
        throw new AuthenticationException('Credenciais inválidas');
      }

      // Gerar tokens
      const tokens = await this.generateTokens(user);

      // Criar sessão
      await this.createSession(user.id, tokens.refreshToken, clientInfo);

      // Cache do usuário
      await this.cacheService.set(`user:${user.id}`, {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }, 3600); // 1 hora

      this.logger.log(`Login bem-sucedido para usuário: ${user.email}`);

      // Calcular timestamp de expiração
      const expiresAt = Math.floor(Date.now() / 1000) + 3600; // 1 hora em timestamp

      return {
        ...tokens,
        expiresAt,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
        },
      };

    } catch (error) {
      this.logger.error(`Erro no login: ${error.message}`, error.stack);
      
      if (error instanceof AuthenticationException) {
        throw error;
      }
      
      throw new AuthenticationException('Erro interno de autenticação');
    }
  }

  /**
   * Registra novo usuário
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    this.logger.log(`Tentativa de registro para email: ${registerDto.email}`);

    try {
      // Verificar se email já existe
      const existingUser = await this.userRepository.findOne({
        where: { email: registerDto.email },
      });

      if (existingUser) {
        throw new BusinessValidationException('Email já está em uso');
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(registerDto.password, this.BCRYPT_ROUNDS);

      // Criar usuário
      const user = this.userRepository.create({
        email: registerDto.email,
        name: registerDto.name,
        password: hashedPassword,
        role: registerDto.role || UserRole.USER,
        status: UserStatus.ACTIVE, // Em produção, pode ser UserStatus.PENDING para verificação de email
      });

      const savedUser = await this.userRepository.save(user);

      // Enviar email de verificação (em background, não bloquear registro)
      this.sendVerificationEmail(savedUser.id).catch(error => {
        this.logger.error('Erro ao enviar email de verificação:', error);
      });

      // Gerar tokens
      const tokens = await this.generateTokens(savedUser);

      // Criar sessão
      await this.createSession(savedUser.id, tokens.refreshToken);

      this.logger.log(`Usuário registrado com sucesso: ${savedUser.email}`);

      // Calcular timestamp de expiração
      const expiresAt = Math.floor(Date.now() / 1000) + 3600; // 1 hora em timestamp

      return {
        ...tokens,
        expiresAt,
        user: {
          id: savedUser.id,
          email: savedUser.email,
          name: savedUser.name,
          role: savedUser.role,
          isEmailVerified: savedUser.isEmailVerified,
        },
      };

    } catch (error) {
      this.logger.error(`Erro no registro: ${error.message}`, error.stack);
      
      if (error instanceof BusinessValidationException) {
        throw error;
      }
      
      throw new BusinessValidationException('Erro no registro do usuário');
    }
  }

  /**
   * Renova access token usando refresh token
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    this.logger.log('Tentativa de renovação de token');

    try {
      // Verificar e decodificar refresh token
      const payload = this.jwtService.verify(refreshTokenDto.refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      // Buscar sessão
      const session = await this.sessionRepository.findOne({
        where: { 
          userId: payload.sub,
          isActive: true,
        },
        relations: ['user'],
      });

      if (!session || session.isExpired()) {
        throw new AuthenticationException('Sessão inválida ou expirada');
      }

      // Verificar hash do refresh token
      const isTokenValid = await bcrypt.compare(
        refreshTokenDto.refreshToken, 
        session.refreshTokenHash
      );

      if (!isTokenValid) {
        this.logger.warn(`Refresh token inválido para usuário: ${payload.sub}`);
        await this.invalidateSession(session.id);
        throw new AuthenticationException('Token inválido');
      }

      // Gerar novos tokens
      const tokens = await this.generateTokens(session.user);

      // Atualizar sessão
      session.refreshTokenHash = await bcrypt.hash(tokens.refreshToken, this.BCRYPT_ROUNDS);
      session.incrementRefreshCount();
      session.updateActivity();
      await this.sessionRepository.save(session);

      this.logger.log(`Token renovado para usuário: ${session.user.email}`);

      // Calcular timestamp de expiração
      const expiresAt = Math.floor(Date.now() / 1000) + 3600; // 1 hora em timestamp

      return {
        ...tokens,
        expiresAt,
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role,
          isEmailVerified: session.user.isEmailVerified,
        },
      };

    } catch (error) {
      this.logger.error(`Erro na renovação de token: ${error.message}`, error.stack);
      
      if (error instanceof AuthenticationException) {
        throw error;
      }
      
      throw new AuthenticationException('Erro na renovação do token');
    }
  }

  /**
   * Realiza logout do usuário
   */
  async logout(logoutDto: LogoutDto): Promise<{ message: string }> {
    this.logger.log('Tentativa de logout');

    try {
      // Decodificar refresh token para obter user ID
      const payload = this.jwtService.decode(logoutDto.refreshToken) as JwtPayload;
      
      if (!payload?.sub) {
        throw new AuthenticationException('Token inválido');
      }

      // Invalidar sessão
      await this.sessionRepository.update(
        { 
          userId: payload.sub,
          isActive: true,
        },
        { 
          isActive: false,
          updatedAt: new Date(),
        }
      );

      // Limpar cache do usuário
      await this.cacheService.del(`user:${payload.sub}`);

      this.logger.log(`Logout realizado para usuário: ${payload.sub}`);

      return { message: 'Logout realizado com sucesso' };

    } catch (error) {
      this.logger.error(`Erro no logout: ${error.message}`, error.stack);
      throw new AuthenticationException('Erro no logout');
    }
  }

  /**
   * Gera tokens JWT
   */
  private async generateTokens(user: User): Promise<{
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
  }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.ACCESS_TOKEN_EXPIRY,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.REFRESH_TOKEN_EXPIRY,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 900, // 15 minutos
    };
  }

  /**
   * Cria nova sessão
   */
  private async createSession(
    userId: number, 
    refreshToken: string, 
    clientInfo?: {
      ipAddress?: string;
      userAgent?: string;
      location?: string;
      deviceType?: string;
    }
  ): Promise<UserSession> {
    // Limitar sessões ativas por usuário (máximo 5)
    await this.limitUserSessions(userId, 5);

    const refreshTokenHash = await bcrypt.hash(refreshToken, this.BCRYPT_ROUNDS);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias

    const session = this.sessionRepository.create({
      userId,
      refreshTokenHash,
      expiresAt,
      isActive: true,
      ipAddress: clientInfo?.ipAddress,
      userAgent: clientInfo?.userAgent,
      location: clientInfo?.location,
      deviceType: clientInfo?.deviceType,
      lastActivityAt: new Date(),
    });

    return await this.sessionRepository.save(session);
  }

  /**
   * Limita número de sessões ativas por usuário
   */
  private async limitUserSessions(userId: number, maxSessions: number): Promise<void> {
    const activeSessions = await this.sessionRepository.find({
      where: { userId, isActive: true },
      order: { createdAt: 'ASC' },
    });

    if (activeSessions.length >= maxSessions) {
      const sessionsToDeactivate = activeSessions.slice(0, activeSessions.length - maxSessions + 1);
      
      for (const session of sessionsToDeactivate) {
        session.deactivate();
      }
      
      await this.sessionRepository.save(sessionsToDeactivate);
    }
  }

  /**
   * Invalida sessão específica
   */
  private async invalidateSession(sessionId: string): Promise<void> {
    await this.sessionRepository.update(sessionId, {
      isActive: false,
      updatedAt: new Date(),
    });
  }

  // ===================================================================
  // MÉTODOS DE VERIFICAÇÃO DE EMAIL E RECUPERAÇÃO DE SENHA
  // ===================================================================

  /**
   * Envia email de verificação para usuário
   */
  async sendVerificationEmail(userId: number): Promise<void> {
    this.logger.log(`Enviando email de verificação para usuário ID: ${userId}`);

    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        select: ['id', 'email', 'name', 'isEmailVerified'],
      });

      if (!user) {
        throw new ResourceNotFoundException('Usuário não encontrado');
      }

      if (user.isEmailVerified) {
        throw new BusinessValidationException('Email já verificado');
      }

      // Gerar token de verificação
      const verificationToken = this.generateSecureToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 horas

      // Salvar token no usuário
      await this.userRepository.update(userId, {
        emailVerificationToken: verificationToken,
        emailVerificationTokenExpiresAt: expiresAt,
        updatedAt: new Date(),
      });

      // Enviar email
      const verificationUrl = this.buildVerificationUrl(verificationToken);
      
      await this.emailService.sendTemplateEmail({
        template: 'VERIFICATION' as any,
        to: user.email,
        data: {
          userName: user.name,
          verificationUrl,
          verificationCode: verificationToken.substring(0, 6).toUpperCase(),
          expirationTime: '24 horas',
        },
      });

      this.logger.log(`Email de verificação enviado para: ${user.email}`);
    } catch (error) {
      this.logger.error(`Erro ao enviar email de verificação:`, error);
      throw error;
    }
  }

  /**
   * Verifica email do usuário
   */
  async verifyEmail(token: string, email?: string): Promise<{
    success: boolean;
    message: string;
    user?: any;
  }> {
    this.logger.log(`Verificando email com token: ${token.substring(0, 8)}...`);

    try {
      // Buscar usuário pelo token
      const whereCondition: any = {
        emailVerificationToken: token,
        emailVerificationTokenExpiresAt: MoreThan(new Date()),
      };

      if (email) {
        whereCondition.email = email;
      }

      const user = await this.userRepository.findOne({
        where: whereCondition,
        select: ['id', 'email', 'name', 'isEmailVerified'],
      });

      if (!user) {
        throw new BusinessValidationException(
          'Token de verificação inválido ou expirado'
        );
      }

      if (user.isEmailVerified) {
        return {
          success: true,
          message: 'Email já verificado anteriormente',
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            emailVerified: true,
          },
        };
      }

      // Marcar email como verificado
      await this.userRepository.update(user.id, {
        isEmailVerified: true,
        emailVerificationToken: undefined,
        emailVerificationTokenExpiresAt: undefined,
        updatedAt: new Date(),
      });

      // Enviar email de boas-vindas
      await this.emailService.sendTemplateEmail({
        template: 'WELCOME' as any,
        to: user.email,
        data: {
          userName: user.name,
          userEmail: user.email,
          dashboardUrl: this.configService.get('FRONTEND_URL') + '/dashboard',
          websiteUrl: this.configService.get('FRONTEND_URL'),
        },
      });

      this.logger.log(`Email verificado com sucesso: ${user.email}`);

      return {
        success: true,
        message: 'Email verificado com sucesso',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: true,
        },
      };
    } catch (error) {
      this.logger.error(`Erro ao verificar email:`, error);
      throw error;
    }
  }

  /**
   * Reenvia email de verificação
   */
  async resendVerificationEmail(email: string): Promise<{
    success: boolean;
    message: string;
    expiresInMinutes: number;
  }> {
    this.logger.log(`Reenviando verificação para: ${email}`);

    try {
      const user = await this.userRepository.findOne({
        where: { email },
        select: ['id', 'email', 'name', 'isEmailVerified', 'emailVerificationTokenExpiresAt'],
      });

      if (!user) {
        // Por segurança, não revelamos que o email não existe
        return {
          success: true,
          message: 'Se o email existir, uma nova verificação foi enviada',
          expiresInMinutes: 60 * 24, // 24 horas
        };
      }

      if (user.isEmailVerified) {
        throw new BusinessValidationException('Email já verificado');
      }

      // Verificar rate limiting (máximo 1 por 5 minutos)
      if (user.emailVerificationTokenExpiresAt) {
        const timeLeft = user.emailVerificationTokenExpiresAt.getTime() - Date.now();
        const minutesLeft = Math.ceil(timeLeft / (1000 * 60));
        
        if (minutesLeft > (24 * 60 - 5)) { // Se foi criado há menos de 5 minutos
          throw new BusinessValidationException(
            `Aguarde ${5 - (24 * 60 - minutesLeft)} minutos antes de solicitar novo email`
          );
        }
      }

      await this.sendVerificationEmail(user.id);

      return {
        success: true,
        message: 'Email de verificação enviado com sucesso',
        expiresInMinutes: 60 * 24, // 24 horas
      };
    } catch (error) {
      this.logger.error(`Erro ao reenviar verificação:`, error);
      throw error;
    }
  }

  /**
   * Inicia processo de recuperação de senha
   */
  async forgotPassword(email: string, callbackUrl?: string): Promise<{
    success: boolean;
    message: string;
    expiresInMinutes: number;
  }> {
    this.logger.log(`Solicitação de recuperação de senha para: ${email}`);

    try {
      const user = await this.userRepository.findOne({
        where: { email, status: UserStatus.ACTIVE },
        select: ['id', 'email', 'name', 'passwordResetTokenExpiresAt'],
      });

      if (!user) {
        // Por segurança, não revelamos que o email não existe
        return {
          success: true,
          message: 'Se o email existir, instruções de recuperação foram enviadas',
          expiresInMinutes: 60, // 1 hora
        };
      }

      // Verificar rate limiting (máximo 1 por 15 minutos)
      if (user.passwordResetTokenExpiresAt) {
        const timeLeft = user.passwordResetTokenExpiresAt.getTime() - Date.now();
        const minutesLeft = Math.ceil(timeLeft / (1000 * 60));
        
        if (minutesLeft > (60 - 15)) { // Se foi criado há menos de 15 minutos
          throw new BusinessValidationException(
            `Aguarde ${15 - (60 - minutesLeft)} minutos antes de solicitar nova recuperação`
          );
        }
      }

      // Gerar token de reset
      const resetToken = this.generateSecureToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // 1 hora

      // Salvar token no usuário
      await this.userRepository.update(user.id, {
        passwordResetToken: resetToken,
        passwordResetTokenExpiresAt: expiresAt,
        updatedAt: new Date(),
      });

      // Enviar email
      const resetUrl = callbackUrl 
        ? `${callbackUrl}?token=${resetToken}&email=${encodeURIComponent(email)}`
        : this.buildPasswordResetUrl(resetToken, email);
      
      await this.emailService.sendTemplateEmail({
        template: 'PASSWORD_RECOVERY' as any,
        to: user.email,
        data: {
          userName: user.name,
          resetUrl,
          resetCode: resetToken.substring(0, 8).toUpperCase(),
          expirationTime: '1 hora',
          ipAddress: 'N/A', // TODO: pegar do request
        },
      });

      this.logger.log(`Email de recuperação enviado para: ${user.email}`);

      return {
        success: true,
        message: 'Instruções de recuperação enviadas por email',
        expiresInMinutes: 60, // 1 hora
      };
    } catch (error) {
      this.logger.error(`Erro ao processar recuperação de senha:`, error);
      throw error;
    }
  }

  /**
   * Reset de senha
   */
  async resetPassword(
    token: string,
    newPassword: string,
    confirmPassword: string,
    email?: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    this.logger.log(`Reset de senha com token: ${token.substring(0, 8)}...`);

    try {
      // Validar confirmação de senha
      if (newPassword !== confirmPassword) {
        throw new BusinessValidationException('Senhas não coincidem');
      }

      // Buscar usuário pelo token
      const whereCondition: any = {
        passwordResetToken: token,
        passwordResetTokenExpiresAt: MoreThan(new Date()),
        status: UserStatus.ACTIVE,
      };

      if (email) {
        whereCondition.email = email;
      }

      const user = await this.userRepository.findOne({
        where: whereCondition,
        select: ['id', 'email', 'name', 'password'],
      });

      if (!user) {
        throw new BusinessValidationException(
          'Token de reset inválido ou expirado'
        );
      }

      // Verificar se a nova senha é diferente da atual
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        throw new BusinessValidationException(
          'A nova senha deve ser diferente da senha atual'
        );
      }

      // Hash da nova senha
      const hashedPassword = await bcrypt.hash(newPassword, this.BCRYPT_ROUNDS);

      // Atualizar senha e limpar token
      await this.userRepository.update(user.id, {
        password: hashedPassword,
        passwordResetToken: undefined,
        passwordResetTokenExpiresAt: undefined,
        updatedAt: new Date(),
      });

      // Invalidar todas as sessões ativas do usuário
      await this.sessionRepository.update(
        { userId: user.id, isActive: true },
        { isActive: false, updatedAt: new Date() }
      );

      // Limpar cache de tokens JWT (método simples)
      try {
        await this.cacheService.del(`auth:${user.id}`);
      } catch (error) {
        this.logger.warn('Erro ao limpar cache:', error);
      }

      this.logger.log(`Senha resetada com sucesso para: ${user.email}`);

      return {
        success: true,
        message: 'Senha alterada com sucesso. Faça login novamente.',
      };
    } catch (error) {
      this.logger.error(`Erro ao resetar senha:`, error);
      throw error;
    }
  }

  // ===================================================================
  // MÉTODOS AUXILIARES PRIVADOS
  // ===================================================================

  /**
   * Gera token seguro para verificações
   */
  private generateSecureToken(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Constrói URL de verificação de email
   */
  private buildVerificationUrl(token: string): string {
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    return `${frontendUrl}/auth/verify-email?token=${token}`;
  }

  /**
   * Constrói URL de reset de senha
   */
  private buildPasswordResetUrl(token: string, email: string): string {
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    return `${frontendUrl}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
  }
}
