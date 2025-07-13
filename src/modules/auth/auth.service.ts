import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { LoggerService } from '../../shared/logger/logger.service';
import { CacheService } from '../../shared/cache/cache.service';
import { User } from '../../database/entities/user.entity';
import { UserSession } from './entities/user-session.entity';
import { 
  LoginDto, 
  RegisterDto, 
  RefreshTokenDto, 
  AuthResponseDto,
  LogoutDto,
  UserRole 
} from './dto';
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

      return {
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
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
        status: 'active', // Em produção, pode ser 'pending' para verificação de email
      });

      const savedUser = await this.userRepository.save(user);

      // Gerar tokens
      const tokens = await this.generateTokens(savedUser);

      // Criar sessão
      await this.createSession(savedUser.id, tokens.refreshToken);

      this.logger.log(`Usuário registrado com sucesso: ${savedUser.email}`);

      return {
        ...tokens,
        user: {
          id: savedUser.id,
          email: savedUser.email,
          name: savedUser.name,
          role: savedUser.role,
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

      return {
        ...tokens,
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role,
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
}
