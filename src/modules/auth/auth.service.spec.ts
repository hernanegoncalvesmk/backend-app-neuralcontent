import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { UserSession } from './entities/user-session.entity';
import { LoggerService } from '../../shared/logger/logger.service';
import { CacheService } from '../../shared/cache/cache.service';
import { LoginDto, RegisterDto, RefreshTokenDto, UserRole } from './dto';
import { UserStatus } from '../users/dto/create-user.dto';
import {
  AuthenticationException,
  BusinessValidationException,
} from '../../shared/exceptions/custom.exceptions';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let sessionRepository: Repository<UserSession>;
  let jwtService: JwtService;
  let configService: ConfigService;
  let loggerService: LoggerService;
  let cacheService: CacheService;

  // Mock data
  const mockUser = {
    id: 1,
    email: 'test@neuralcontent.com',
    name: 'Test User',
    password: '$2b$12$hashedPassword',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    phone: undefined,
    avatarUrl: undefined,
    bio: undefined,
    city: undefined,
    country: undefined,
    timezone: undefined,
    preferredLanguage: 'pt-BR',
    lastLoginAt: new Date(),
    lastLoginIp: '127.0.0.1',
    isEmailVerified: true,
    emailVerificationToken: undefined,
    emailVerificationTokenExpiresAt: undefined,
    passwordResetToken: undefined,
    passwordResetTokenExpiresAt: undefined,
    failedLoginAttempts: 0,
    lockedUntil: undefined,
    emailNotifications: true,
    marketingEmails: false,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    // Relations
    sessions: [],
    // Methods
    canLogin: () => true,
    isActive: () => true,
    isLocked: () => false,
    isLockedOut: () => false,
    isAdmin: () => false,
    isModerator: () => false,
    hasAdminRights: () => false,
    incrementFailedLogin: jest.fn(),
    incrementFailedAttempts: jest.fn(),
    resetFailedLogin: jest.fn(),
    resetFailedAttempts: jest.fn(),
    lockAccount: jest.fn(),
    unlockAccount: jest.fn(),
    updateLastLogin: jest.fn(),
    generateEmailVerificationToken: jest.fn(),
    generatePasswordResetToken: jest.fn(),
    clearEmailVerificationToken: jest.fn(),
    clearPasswordResetToken: jest.fn(),
    updatePassword: jest.fn(),
    getFullName: () => 'Test User',
    getInitials: () => 'TU',
    getAvatarUrl: () => 'https://via.placeholder.com/150',
    getDisplayName: () => 'Test User',
    hasRole: jest.fn(),
    checkPassword: jest.fn(),
    toResponseDto: jest.fn(),
    // TypeORM BaseEntity methods
    version: 1,
    hasId: () => true,
    save: jest.fn(),
    remove: jest.fn(),
    softRemove: jest.fn(),
    recover: jest.fn(),
    reload: jest.fn(),
  };

  const mockLoginDto: LoginDto = {
    email: 'test@neuralcontent.com',
    password: 'password123',
    rememberMe: false,
  };

  const mockRegisterDto: RegisterDto = {
    email: 'newuser@neuralcontent.com',
    name: 'New User',
    password: 'MinhaS3nh@Segura123',
    role: UserRole.USER,
  };

  const mockTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    tokenType: 'Bearer',
    expiresIn: 900,
  };

  beforeEach(async () => {
    const mockUserRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockSessionRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    const mockJwtService = {
      signAsync: jest.fn(),
      verify: jest.fn(),
      decode: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          JWT_SECRET: 'test-secret',
          JWT_REFRESH_SECRET: 'test-refresh-secret',
          JWT_EXPIRES_IN: '15m',
          JWT_REFRESH_EXPIRES_IN: '7d',
        };
        return config[key];
      }),
    };

    const mockLoggerService = {
      setContext: jest.fn(),
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const mockCacheService = {
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(UserSession),
          useValue: mockSessionRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    sessionRepository = module.get<Repository<UserSession>>(
      getRepositoryToken(UserSession),
    );
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    loggerService = module.get<LoggerService>(LoggerService);
    cacheService = module.get<CacheService>(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should successfully login a user with valid credentials', async () => {
      // Arrange
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest
        .spyOn(jwtService, 'signAsync')
        .mockResolvedValueOnce('mock-access-token')
        .mockResolvedValueOnce('mock-refresh-token');
      jest.spyOn(sessionRepository, 'find').mockResolvedValue([]);
      jest
        .spyOn(sessionRepository, 'create')
        .mockReturnValue({} as UserSession);
      jest
        .spyOn(sessionRepository, 'save')
        .mockResolvedValue({} as UserSession);
      jest
        .spyOn(bcrypt, 'hash')
        .mockResolvedValue('hashed-refresh-token' as never);

      // Act
      const result = await service.login(mockLoginDto);

      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(mockUser.email);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: mockLoginDto.email },
        select: ['id', 'email', 'name', 'password', 'role', 'status'],
      });
    });

    it('should throw AuthenticationException for non-existent user', async () => {
      // Arrange
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(mockLoginDto)).rejects.toThrow(
        AuthenticationException,
      );
    });

    it('should throw AuthenticationException for inactive user', async () => {
      // Arrange
      const inactiveUser = { ...mockUser, status: UserStatus.INACTIVE };
      jest
        .spyOn(userRepository, 'findOne')
        .mockResolvedValue(inactiveUser as User);

      // Act & Assert
      await expect(service.login(mockLoginDto)).rejects.toThrow(
        AuthenticationException,
      );
    });

    it('should throw AuthenticationException for invalid password', async () => {
      // Arrange
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      // Act & Assert
      await expect(service.login(mockLoginDto)).rejects.toThrow(
        AuthenticationException,
      );
    });
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      // Arrange
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password' as never);
      jest.spyOn(userRepository, 'create').mockReturnValue(mockUser as User);
      jest.spyOn(userRepository, 'save').mockResolvedValue(mockUser as User);
      jest
        .spyOn(jwtService, 'signAsync')
        .mockResolvedValueOnce('mock-access-token')
        .mockResolvedValueOnce('mock-refresh-token');
      jest.spyOn(sessionRepository, 'find').mockResolvedValue([]);
      jest
        .spyOn(sessionRepository, 'create')
        .mockReturnValue({} as UserSession);
      jest
        .spyOn(sessionRepository, 'save')
        .mockResolvedValue({} as UserSession);

      // Act
      const result = await service.register(mockRegisterDto);

      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(userRepository.create).toHaveBeenCalledWith({
        email: mockRegisterDto.email,
        name: mockRegisterDto.name,
        password: 'hashed-password',
        role: mockRegisterDto.role,
        status: UserStatus.ACTIVE,
      });
    });

    it('should throw BusinessValidationException for existing email', async () => {
      // Arrange
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);

      // Act & Assert
      await expect(service.register(mockRegisterDto)).rejects.toThrow(
        BusinessValidationException,
      );
    });
  });

  describe('refreshToken', () => {
    const mockRefreshTokenDto: RefreshTokenDto = {
      refreshToken: 'valid-refresh-token',
    };

    const mockSession = {
      id: 'session-id',
      userId: 1,
      refreshTokenHash: 'hashed-refresh-token',
      isActive: true,
      isExpired: jest.fn().mockReturnValue(false),
      incrementRefreshCount: jest.fn(),
      updateActivity: jest.fn(),
      user: mockUser,
    };

    it('should successfully refresh tokens', async () => {
      // Arrange
      jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: 1 });
      jest
        .spyOn(sessionRepository, 'findOne')
        .mockResolvedValue(mockSession as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest
        .spyOn(jwtService, 'signAsync')
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');
      jest
        .spyOn(bcrypt, 'hash')
        .mockResolvedValue('new-hashed-refresh-token' as never);
      jest
        .spyOn(sessionRepository, 'save')
        .mockResolvedValue(mockSession as any);

      // Act
      const result = await service.refreshToken(mockRefreshTokenDto);

      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.accessToken).toBe('new-access-token');
      expect(mockSession.incrementRefreshCount).toHaveBeenCalled();
      expect(mockSession.updateActivity).toHaveBeenCalled();
    });

    it('should throw AuthenticationException for invalid session', async () => {
      // Arrange
      jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: 1 });
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(service.refreshToken(mockRefreshTokenDto)).rejects.toThrow(
        AuthenticationException,
      );
    });

    it('should throw AuthenticationException for expired session', async () => {
      // Arrange
      const expiredSession = {
        ...mockSession,
        isExpired: jest.fn().mockReturnValue(true),
      };
      jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: 1 });
      jest
        .spyOn(sessionRepository, 'findOne')
        .mockResolvedValue(expiredSession as any);

      // Act & Assert
      await expect(service.refreshToken(mockRefreshTokenDto)).rejects.toThrow(
        AuthenticationException,
      );
    });
  });

  describe('logout', () => {
    const mockLogoutDto = {
      refreshToken: 'valid-refresh-token',
    };

    it('should successfully logout user', async () => {
      // Arrange
      jest.spyOn(jwtService, 'decode').mockReturnValue({ sub: 1 });
      jest.spyOn(sessionRepository, 'update').mockResolvedValue({} as any);
      jest.spyOn(cacheService, 'del').mockResolvedValue();

      // Act
      const result = await service.logout(mockLogoutDto);

      // Assert
      expect(result).toEqual({ message: 'Logout realizado com sucesso' });
      expect(sessionRepository.update).toHaveBeenCalledWith(
        { userId: 1, isActive: true },
        { isActive: false, updatedAt: expect.any(Date) },
      );
      expect(cacheService.del).toHaveBeenCalledWith('user:1');
    });

    it('should throw AuthenticationException for invalid token', async () => {
      // Arrange
      jest.spyOn(jwtService, 'decode').mockReturnValue(null);

      // Act & Assert
      await expect(service.logout(mockLogoutDto)).rejects.toThrow(
        AuthenticationException,
      );
    });
  });
});
