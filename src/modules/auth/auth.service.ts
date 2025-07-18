import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { LoggerService } from '../../shared/logger/logger.service';
import { CacheService } from '../../shared/cache/cache.service';
import {
  User,
  UserRole as EntityUserRole,
} from '../users/entities/user.entity';
import { UserSession } from './entities/user-session.entity';
import {
  VerificationToken,
  VerificationTokenType,
} from './entities/verification-token.entity';
import {
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  AuthResponseDto,
  LogoutDto,
  UserRole,
} from './dto';
import {
  BusinessValidationException,
  ResourceNotFoundException,
  AuthenticationException,
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

    @InjectRepository(VerificationToken)
    private readonly verificationTokenRepository: Repository<VerificationToken>,

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
  async login(
    loginDto: LoginDto,
    clientInfo?: {
      ipAddress?: string;
      userAgent?: string;
      location?: string;
      deviceType?: string;
    },
  ): Promise<AuthResponseDto> {
    this.logger.log(`Tentativa de login para email: ${loginDto.email}`);

    try {
      // Buscar usuário com senha
      const user = await this.userRepository.findOne({
        where: { email: loginDto.email },
        select: [
          'id',
          'email',
          'firstName',
          'lastName',
          'password',
          'role',
          'isActive',
        ],
      });

      if (!user) {
        this.logger.warn(`Usuário não encontrado: ${loginDto.email}`);
        throw new AuthenticationException('Credenciais inválidas');
      }

      // Verificar status do usuário
      if (!user.isActive) {
        this.logger.warn(
          `Usuário inativo tentou fazer login: ${loginDto.email}`,
        );
        throw new AuthenticationException(
          'Conta inativa. Entre em contato com o suporte.',
        );
      }

      // Verificar senha
      const isPasswordValid = await bcrypt.compare(
        loginDto.password,
        user.password,
      );
      if (!isPasswordValid) {
        this.logger.warn(`Senha incorreta para usuário: ${loginDto.email}`);
        throw new AuthenticationException('Credenciais inválidas');
      }

      // Gerar tokens
      const tokens = await this.generateTokens(user);

      // Criar sessão
      await this.createSession(user.id, tokens.refreshToken, clientInfo);

      // Cache do usuário
      await this.cacheService.set(
        `user:${user.id}`,
        {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        3600,
      ); // 1 hora

      this.logger.log(`Login bem-sucedido para usuário: ${user.email}`);

      // Calcular timestamp de expiração
      const expiresAt = Math.floor(Date.now() / 1000) + 3600; // 1 hora em timestamp

      return {
        ...tokens,
        expiresAt,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
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
      const hashedPassword = await bcrypt.hash(
        registerDto.password,
        this.BCRYPT_ROUNDS,
      );

      // Criar usuário
      const user = this.userRepository.create({
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        password: hashedPassword,
        role: (registerDto.role || UserRole.USER) as unknown as EntityUserRole,
        isActive: true, // Em produção, pode ser false para verificação de email
      });

      const savedUser = await this.userRepository.save(user);
      // TypeORM save pode retornar User ou User[] dependendo do input, fazemos cast para User
      const userResult = Array.isArray(savedUser) ? savedUser[0] : savedUser;

      // Gerar tokens
      const tokens = await this.generateTokens(userResult);

      // Criar sessão
      await this.createSession(userResult.id, tokens.refreshToken);

      this.logger.log(`Usuário registrado com sucesso: ${userResult.email}`);

      // Calcular timestamp de expiração
      const expiresAt = Math.floor(Date.now() / 1000) + 3600; // 1 hora em timestamp

      return {
        ...tokens,
        expiresAt,
        user: {
          id: userResult.id,
          email: userResult.email,
          firstName: userResult.firstName,
          lastName: userResult.lastName,
          role: userResult.role,
          isEmailVerified: userResult.isEmailVerified,
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
  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<AuthResponseDto> {
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
        session.refreshToken,
      );

      if (!isTokenValid) {
        this.logger.warn(`Refresh token inválido para usuário: ${payload.sub}`);
        await this.invalidateSession(session.id);
        throw new AuthenticationException('Token inválido');
      }

      // Gerar novos tokens
      const tokens = await this.generateTokens(session.user);

      // Atualizar sessão
      session.refreshToken = await bcrypt.hash(
        tokens.refreshToken,
        this.BCRYPT_ROUNDS,
      );
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
          firstName: session.user.firstName,
          lastName: session.user.lastName,
          role: session.user.role,
          isEmailVerified: session.user.isEmailVerified,
        },
      };
    } catch (error) {
      this.logger.error(
        `Erro na renovação de token: ${error.message}`,
        error.stack,
      );

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
      const payload = this.jwtService.decode(logoutDto.refreshToken);

      if (!payload?.sub) {
        throw new AuthenticationException('Token inválido');
      }

      // Invalidar sessão
      await this.sessionRepository.update(
        {
          userId: payload.sub.toString(),
          isActive: true,
        },
        {
          isActive: false,
          updatedAt: new Date(),
        },
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
    },
  ): Promise<UserSession> {
    // Limitar sessões ativas por usuário (máximo 5)
    await this.limitUserSessions(userId, 5);

    const refreshTokenHash = await bcrypt.hash(
      refreshToken,
      this.BCRYPT_ROUNDS,
    );
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias

    const session = this.sessionRepository.create({
      userId: parseInt(userId.toString(), 10),
      sessionToken: UserSession.generateSessionToken(),
      refreshToken: refreshTokenHash,
      expiresAt,
      isActive: true,
      ipAddress: clientInfo?.ipAddress,
      userAgent: clientInfo?.userAgent,
    });

    return await this.sessionRepository.save(session);
  }

  /**
   * Limita número de sessões ativas por usuário
   */
  private async limitUserSessions(
    userId: number,
    maxSessions: number,
  ): Promise<void> {
    const activeSessions = await this.sessionRepository.find({
      where: { userId: userId, isActive: true },
      order: { createdAt: 'ASC' },
    });

    if (activeSessions.length >= maxSessions) {
      const sessionsToDeactivate = activeSessions.slice(
        0,
        activeSessions.length - maxSessions + 1,
      );

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

  // VerificationToken Management Methods

  /**
   * Cria um token de verificação
   */
  async createVerificationToken(
    userId: number,
    type: VerificationTokenType,
    expiresInMinutes: number = 60,
  ): Promise<VerificationToken> {
    this.logger.log(
      `Creating verification token for user ${userId}, type: ${type}`,
    );

    try {
      // Convert userId to string for compatibility with VerificationToken entity
      const userIdString = userId.toString();

      // Invalidate existing tokens of the same type for this user
      await this.invalidateUserVerificationTokens(userId, type);

      const token = this.verificationTokenRepository.create({
        userId: parseInt(userIdString, 10),
        type,
        expiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000),
      });

      const savedToken = await this.verificationTokenRepository.save(token);
      this.logger.log(`Verification token created: ${savedToken.id}`);

      return savedToken;
    } catch (error) {
      this.logger.error(
        `Error creating verification token: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Valida um token de verificação
   */
  async validateVerificationToken(
    tokenValue: string,
    type: VerificationTokenType,
  ): Promise<VerificationToken> {
    this.logger.log(
      `Validating verification token: ${tokenValue}, type: ${type}`,
    );

    try {
      const token = await this.verificationTokenRepository.findOne({
        where: {
          token: tokenValue,
          type,
          isUsed: false,
        },
        relations: ['user'],
      });

      if (!token) {
        throw new BadRequestException('Token inválido ou não encontrado');
      }

      if (token.isExpired) {
        throw new BadRequestException('Token expirado');
      }

      return token;
    } catch (error) {
      this.logger.error(
        `Error validating verification token: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Marca um token como usado
   */
  async markTokenAsUsed(tokenId: string): Promise<void> {
    this.logger.log(`Marking token as used: ${tokenId}`);

    try {
      await this.verificationTokenRepository.update(tokenId, {
        isUsed: true,
        usedAt: new Date(),
      });
    } catch (error) {
      this.logger.error(
        `Error marking token as used: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Invalida todos os tokens de verificação de um usuário para um tipo específico
   */
  async invalidateUserVerificationTokens(
    userId: number,
    type?: VerificationTokenType,
  ): Promise<void> {
    this.logger.log(
      `Invalidating verification tokens for user ${userId}, type: ${type || 'all'}`,
    );

    try {
      const userIdString = userId.toString();
      const whereConditions: any = { userId: userIdString, isUsed: false };
      if (type) {
        whereConditions.type = type;
      }

      await this.verificationTokenRepository.update(whereConditions, {
        isUsed: true,
        usedAt: new Date(),
      });
    } catch (error) {
      this.logger.error(
        `Error invalidating verification tokens: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Obtém tokens de verificação de um usuário
   */
  async getUserVerificationTokens(
    userId: number,
    type?: VerificationTokenType,
    includeUsed: boolean = false,
  ): Promise<VerificationToken[]> {
    this.logger.log(
      `Getting verification tokens for user ${userId}, type: ${type || 'all'}`,
    );

    try {
      const userIdString = userId.toString();
      const whereConditions: any = { userId: userIdString };
      if (type) {
        whereConditions.type = type;
      }
      if (!includeUsed) {
        whereConditions.isUsed = false;
      }

      const tokens = await this.verificationTokenRepository.find({
        where: whereConditions,
        order: { createdAt: 'DESC' },
      });

      return tokens;
    } catch (error) {
      this.logger.error(
        `Error getting verification tokens: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
