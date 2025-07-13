import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto, UserRole as DtoUserRole, UserStatus } from './dto/create-user.dto';
import { UpdateUserDto, ChangePasswordDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { AuthGuard } from '../../shared/guards/auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';

/**
 * Test Suite para UsersController
 * 
 * @description Testa todos os endpoints do controller de usuários
 * @author NeuralContent Team
 * @since 1.0.0
 */
describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  // Mock do UsersService
  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    changePassword: jest.fn(),
    remove: jest.fn(),
    getUserStats: jest.fn(),
  };

  // Mock do JwtService
  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  // Mock do AuthGuard
  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  // Mock do RolesGuard
  const mockRolesGuard = {
    canActivate: jest.fn(() => true),
  };

  // Mock de Request com user
  const mockRequest = {
    user: { sub: 1, email: 'test@example.com', role: 'user' },
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'Test@123456',
        name: 'Test User',
        role: DtoUserRole.USER,
        status: UserStatus.ACTIVE,
      };

      const mockUser = {
        id: 1,
        ...createUserDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await controller.create(createUserDto);

      expect(service.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toBeInstanceOf(UserResponseDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated users list', async () => {
      const mockResult = {
        data: [
          {
            id: 1,
            email: 'user1@example.com',
            name: 'User One',
            role: DtoUserRole.USER,
            status: UserStatus.ACTIVE,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      mockUsersService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(1, 10);

      expect(service.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
        role: undefined,
        status: undefined,
      });
      expect(result).toEqual(mockResult);
    });

    it('should limit the maximum items per page to 100', async () => {
      const mockResult = {
        data: [],
        pagination: {
          page: 1,
          limit: 100,
          total: 0,
          totalPages: 0,
        },
      };

      mockUsersService.findAll.mockResolvedValue(mockResult);

      await controller.findAll(1, 200, 'search', DtoUserRole.USER, UserStatus.ACTIVE);

      expect(service.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 100, // Deve ser limitado a 100
        search: 'search',
        role: DtoUserRole.USER,
        status: UserStatus.ACTIVE,
      });
    });
  });

  describe('getStats', () => {
    it('should return user statistics', async () => {
      const mockStats = {
        totalUsers: 100,
        activeUsers: 85,
        inactiveUsers: 10,
        suspendedUsers: 5,
        usersByRole: {
          admin: 2,
          moderator: 8,
          user: 90,
        },
        recentRegistrations: 5,
        usersCreatedThisMonth: 15,
      };

      mockUsersService.getUserStats.mockResolvedValue(mockStats);

      const result = await controller.getStats();

      expect(service.getUserStats).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });
  });

  describe('getProfile', () => {
    it('should return current user profile', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: DtoUserRole.USER,
        status: UserStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await controller.getProfile(mockRequest);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toBeInstanceOf(UserResponseDto);
    });
  });

  describe('updateProfile', () => {
    it('should update current user profile', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Updated Name',
        role: DtoUserRole.USER,
        status: UserStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.update.mockResolvedValue(mockUser);

      const result = await controller.updateProfile(mockRequest, updateUserDto);

      expect(service.update).toHaveBeenCalledWith(1, updateUserDto);
      expect(result).toBeInstanceOf(UserResponseDto);
    });
  });

  describe('findOne', () => {
    it('should return a user by ID', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: DtoUserRole.USER,
        status: UserStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne(1);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toBeInstanceOf(UserResponseDto);
    });
  });

  describe('update', () => {
    it('should update a user by ID', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
        status: UserStatus.INACTIVE,
      };

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Updated Name',
        role: DtoUserRole.USER,
        status: UserStatus.INACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.update.mockResolvedValue(mockUser);

      const result = await controller.update(1, updateUserDto);

      expect(service.update).toHaveBeenCalledWith(1, updateUserDto);
      expect(result).toBeInstanceOf(UserResponseDto);
    });
  });

  describe('updateStatus', () => {
    it('should update user status', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: DtoUserRole.USER,
        status: UserStatus.SUSPENDED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.updateStatus.mockResolvedValue(mockUser);

      const result = await controller.updateStatus(1, UserStatus.SUSPENDED);

      expect(service.updateStatus).toHaveBeenCalledWith(1, UserStatus.SUSPENDED);
      expect(result).toBeInstanceOf(UserResponseDto);
    });
  });

  describe('changePassword', () => {
    it('should change user password', async () => {
      const changePasswordDto: ChangePasswordDto = {
        newPassword: 'NewPass@123',
        confirmPassword: 'NewPass@123',
      };

      mockUsersService.changePassword.mockResolvedValue(undefined);

      const result = await controller.changePassword(1, changePasswordDto);

      expect(service.changePassword).toHaveBeenCalledWith(1, changePasswordDto);
      expect(result).toEqual({ message: 'Password changed successfully' });
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      mockUsersService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(1);

      expect(service.remove).toHaveBeenCalledWith(1);
      expect(result).toBeUndefined();
    });
  });

  describe('activateUser', () => {
    it('should activate a user', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: DtoUserRole.USER,
        status: UserStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.updateStatus.mockResolvedValue(mockUser);

      const result = await controller.activateUser(1);

      expect(service.updateStatus).toHaveBeenCalledWith(1, UserStatus.ACTIVE);
      expect(result).toBeInstanceOf(UserResponseDto);
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate a user', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: DtoUserRole.USER,
        status: UserStatus.INACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.updateStatus.mockResolvedValue(mockUser);

      const result = await controller.deactivateUser(1);

      expect(service.updateStatus).toHaveBeenCalledWith(1, UserStatus.INACTIVE);
      expect(result).toBeInstanceOf(UserResponseDto);
    });
  });
});
