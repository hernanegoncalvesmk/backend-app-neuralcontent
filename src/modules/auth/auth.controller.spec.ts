import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoggerService } from '../../shared/logger/logger.service';
import { 
  LoginDto, 
  RegisterDto, 
  RefreshTokenDto, 
  AuthResponseDto,
  LogoutDto,
  UserRole 
} from './dto';

/**
 * Testes unitários para AuthController
 * 
 * @description Valida todos os endpoints de autenticação
 * @author NeuralContent Team
 * @since 1.0.0
 */
describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let loggerService: LoggerService;

  // Mock do AuthService
  const mockAuthService = {
    login: jest.fn(),
    register: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
  };

  // Mock do LoggerService
  const mockLoggerService = {
    setContext: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  // Mock do Request
  const mockRequest = {
    ip: '127.0.0.1',
    get: jest.fn((header: string) => {
      if (header === 'User-Agent') return 'Jest/Test Browser';
      return undefined;
    }),
    user: {
      id: 1,
      email: 'test@neuralcontent.com',
      name: 'Test User',
      role: 'user' as UserRole,
      isEmailVerified: true,
    }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    loggerService = module.get<LoggerService>(LoggerService);

    // Limpar todos os mocks antes de cada teste
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginDto: LoginDto = {
        email: 'test@neuralcontent.com',
        password: 'ValidPassword123!',
      };

      const expectedResponse: AuthResponseDto = {
        accessToken: 'mock.access.token',
        refreshToken: 'mock.refresh.token',
        tokenType: 'Bearer',
        expiresIn: 900,
        expiresAt: 1625097600,
        user: {
          id: 1,
          email: 'test@neuralcontent.com',
          name: 'Test User',
          role: 'user' as UserRole,
          isEmailVerified: true,
        }
      };

      mockAuthService.login.mockResolvedValue(expectedResponse);

      const result = await controller.login(loginDto, mockRequest as any);

      expect(result).toEqual(expectedResponse);
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto, {
        ipAddress: '127.0.0.1',
        userAgent: 'Jest/Test Browser',
        deviceType: 'desktop',
      });
      expect(mockLoggerService.log).toHaveBeenCalledWith(
        `Login attempt for email: ${loginDto.email}`,
        {
          ip: '127.0.0.1',
          userAgent: 'Jest/Test Browser',
        }
      );
    });

    it('should detect mobile device correctly', async () => {
      const loginDto: LoginDto = {
        email: 'test@neuralcontent.com',
        password: 'ValidPassword123!',
      };

      const mobileRequest = {
        ...mockRequest,
        get: jest.fn((header: string) => {
          if (header === 'User-Agent') return 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
          return undefined;
        }),
      };

      const expectedResponse: AuthResponseDto = {
        accessToken: 'mock.access.token',
        refreshToken: 'mock.refresh.token',
        tokenType: 'Bearer',
        expiresIn: 900,
        expiresAt: 1625097600,
        user: {
          id: 1,
          email: 'test@neuralcontent.com',
          name: 'Test User',
          role: 'user' as UserRole,
          isEmailVerified: true,
        }
      };

      mockAuthService.login.mockResolvedValue(expectedResponse);

      await controller.login(loginDto, mobileRequest as any);

      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto, {
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        deviceType: 'mobile',
      });
    });
  });

  describe('register', () => {
    it('should register user successfully', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@neuralcontent.com',
        password: 'ValidPassword123!',
        name: 'New User',
        role: 'user' as UserRole,
      };

      const expectedResponse: AuthResponseDto = {
        accessToken: 'mock.access.token',
        refreshToken: 'mock.refresh.token',
        tokenType: 'Bearer',
        expiresIn: 900,
        expiresAt: 1625097600,
        user: {
          id: 2,
          email: 'newuser@neuralcontent.com',
          name: 'New User',
          role: 'user' as UserRole,
          isEmailVerified: true,
        }
      };

      mockAuthService.register.mockResolvedValue(expectedResponse);

      const result = await controller.register(registerDto, mockRequest as any);

      expect(result).toEqual(expectedResponse);
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
      expect(mockLoggerService.log).toHaveBeenCalledWith(
        `Registration attempt for email: ${registerDto.email}`,
        {
          ip: '127.0.0.1',
          userAgent: 'Jest/Test Browser',
        }
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: 'valid.refresh.token',
      };

      const expectedResponse: AuthResponseDto = {
        accessToken: 'new.access.token',
        refreshToken: 'new.refresh.token',
        tokenType: 'Bearer',
        expiresIn: 900,
        expiresAt: 1625097600,
        user: {
          id: 1,
          email: 'test@neuralcontent.com',
          name: 'Test User',
          role: 'user' as UserRole,
          isEmailVerified: true,
        }
      };

      mockAuthService.refreshToken.mockResolvedValue(expectedResponse);

      const result = await controller.refreshToken(refreshTokenDto);

      expect(result).toEqual(expectedResponse);
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(refreshTokenDto);
      expect(mockLoggerService.log).toHaveBeenCalledWith('Token refresh attempt');
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const logoutDto: LogoutDto = {
        refreshToken: 'valid.refresh.token',
      };

      const expectedResponse = {
        message: 'Logout realizado com sucesso'
      };

      mockAuthService.logout.mockResolvedValue(expectedResponse);

      const result = await controller.logout(logoutDto, mockRequest as any);

      expect(result).toEqual(expectedResponse);
      expect(mockAuthService.logout).toHaveBeenCalledWith(logoutDto);
      expect(mockLoggerService.log).toHaveBeenCalledWith('Logout attempt', {
        ip: '127.0.0.1',
        userAgent: 'Jest/Test Browser',
      });
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const result = await controller.getProfile(mockRequest as any);

      expect(result).toEqual({
        id: 1,
        email: 'test@neuralcontent.com',
        name: 'Test User',
        role: 'user',
        status: 'active',
      });
      expect(mockLoggerService.log).toHaveBeenCalledWith('Profile access for user ID: 1');
    });
  });

  describe('extractClientInfo', () => {
    it('should extract client info correctly for desktop', () => {
      const desktopRequest = {
        ip: '192.168.1.100',
        get: jest.fn((header: string) => {
          if (header === 'User-Agent') return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
          return undefined;
        }),
      };

      const result = (controller as any).extractClientInfo(desktopRequest);

      expect(result).toEqual({
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        deviceType: 'desktop',
      });
    });

    it('should extract client info correctly for tablet', () => {
      const tabletRequest = {
        ip: '192.168.1.101',
        get: jest.fn((header: string) => {
          if (header === 'User-Agent') return 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)';
          return undefined;
        }),
      };

      const result = (controller as any).extractClientInfo(tabletRequest);

      expect(result).toEqual({
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)',
        deviceType: 'tablet',
      });
    });

    it('should handle missing user agent', () => {
      const requestWithoutUA = {
        ip: '192.168.1.102',
        get: jest.fn(() => undefined),
      };

      const result = (controller as any).extractClientInfo(requestWithoutUA);

      expect(result).toEqual({
        ipAddress: '192.168.1.102',
        userAgent: '',
        deviceType: 'desktop',
      });
    });
  });
});
