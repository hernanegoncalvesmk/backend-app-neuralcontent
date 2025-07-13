import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserDto, UserRole, UserStatus } from './dto/create-user.dto';
import { UpdateUserDto, ChangePasswordDto } from './dto/update-user.dto';
import { 
  BusinessValidationException,
  ResourceNotFoundException 
} from '../../shared/exceptions/custom.exceptions';
import { ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: Repository<User>;
  let configService: ConfigService;

  // Mock Repository
  const mockUserRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  // Mock ConfigService
  const mockConfigService = {
    get: jest.fn(),
  };

  // Mock User
  const mockUser: Partial<User> = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedPassword',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    isEmailVerified: false,
    failedLoginAttempts: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Mock CreateUserDto
  const mockCreateUserDto: CreateUserDto = {
    email: 'test@example.com',
    name: 'Test User',
    password: 'TestPassword123',
    role: UserRole.USER,
    status: UserStatus.PENDING,
    phone: '+5511999999999',
    bio: 'Test bio',
    city: 'São Paulo',
    country: 'Brazil',
    timezone: 'America/Sao_Paulo',
    preferredLanguage: 'pt-BR',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    configService = module.get<ConfigService>(ConfigService);

    // Setup ConfigService mocks
    mockConfigService.get.mockImplementation((key: string, defaultValue?: any) => {
      if (key === 'BCRYPT_ROUNDS') return 12;
      return defaultValue;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(null); // Email não existe
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      // Act
      const result = await service.create(mockCreateUserDto);

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { 
          email: mockCreateUserDto.email.toLowerCase().trim(),
          deletedAt: expect.anything()
        },
      });
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException when email already exists', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.create(mockCreateUserDto)).rejects.toThrow(ConflictException);
    });

    it('should throw ForbiddenException when trying to create admin user', async () => {
      // Arrange
      const adminUserDto = { ...mockCreateUserDto, role: UserRole.ADMIN };
      mockUserRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(adminUserDto)).rejects.toThrow(ForbiddenException);
    });

    it('should validate password strength', async () => {
      // Arrange
      const weakPasswordDto = { ...mockCreateUserDto, password: '123' };
      mockUserRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(weakPasswordDto)).rejects.toThrow(BusinessValidationException);
    });
  });

  describe('findAll', () => {
    it('should return paginated users list', async () => {
      // Arrange
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockUser], 1]),
      };
      mockUserRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Act
      const result = await service.findAll({ page: 1, limit: 10 });

      // Assert
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.meta.total).toBe(1);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('user.deletedAt IS NULL');
    });

    it('should apply search filters correctly', async () => {
      // Arrange
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      mockUserRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Act
      await service.findAll({ 
        page: 1, 
        limit: 10, 
        search: 'test',
        role: UserRole.USER,
        status: UserStatus.ACTIVE 
      });

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(user.name ILIKE :search OR user.email ILIKE :search)',
        { search: '%test%' }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('user.role = :role', { role: UserRole.USER });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('user.status = :status', { status: UserStatus.ACTIVE });
    });
  });

  describe('findOne', () => {
    it('should return user when found', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await service.findOne(1);

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: expect.anything() },
      });
    });

    it('should throw ResourceNotFoundException when user not found', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(999)).rejects.toThrow(ResourceNotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should return user when found by email', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await service.findByEmail('test@example.com');

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { 
          email: 'test@example.com',
          deletedAt: expect.anything() 
        },
        select: ['id', 'email', 'name', 'role', 'status', 'password'],
      });
    });

    it('should throw ResourceNotFoundException when user not found by email', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findByEmail('notfound@example.com')).rejects.toThrow(ResourceNotFoundException);
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      name: 'Updated User',
      phone: '+5511888888888',
    };

    it('should update user successfully', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      const updatedUser = { ...mockUser, ...updateUserDto, updatedAt: new Date() };
      mockUserRepository.save.mockResolvedValue(updatedUser);

      // Act
      const result = await service.update(1, updateUserDto);

      // Assert
      expect(result.name).toBe(updateUserDto.name);
      expect(result.phone).toBe(updateUserDto.phone);
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should validate email uniqueness when updating email', async () => {
      // Arrange
      const updateWithEmail: UpdateUserDto = { ...updateUserDto, email: 'newemail@example.com' };
      mockUserRepository.findOne
        .mockResolvedValueOnce(mockUser) // findOne para buscar usuário
        .mockResolvedValueOnce(null); // validateEmailUniqueness
      const updatedUser = { ...mockUser, ...updateWithEmail, updatedAt: new Date() };
      mockUserRepository.save.mockResolvedValue(updatedUser);

      // Act
      const result = await service.update(1, updateWithEmail);

      // Assert
      expect(result.email).toBe(updateWithEmail.email);
      expect(result.name).toBe(updateWithEmail.name);
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException when updating to existing email', async () => {
      // Arrange
      const updateWithEmail: UpdateUserDto = { ...updateUserDto, email: 'existing@example.com' };
      const otherUser = { ...mockUser, id: 2, email: 'existing@example.com' };
      
      mockUserRepository.findOne
        .mockResolvedValueOnce(mockUser) // findOne para buscar usuário
        .mockResolvedValueOnce(otherUser); // validateEmailUniqueness

      // Act & Assert
      await expect(service.update(1, updateWithEmail)).rejects.toThrow(ConflictException);
    });
  });

  describe('changePassword', () => {
    const changePasswordDto: ChangePasswordDto = {
      currentPassword: 'OldPassword123',
      newPassword: 'NewPassword123',
      confirmPassword: 'NewPassword123',
    };

    it('should change password successfully', async () => {
      // Arrange
      const currentPasswordHash = 'hashedOldPassword';
      const userWithPassword = { ...mockUser, password: currentPasswordHash };
      mockUserRepository.findOne.mockResolvedValue(userWithPassword);
      mockUserRepository.save.mockResolvedValue(userWithPassword);

      // Mock bcrypt
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('newHashedPassword' as never);

      // Act
      await service.changePassword(1, changePasswordDto);

      // Assert
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(bcrypt.compare).toHaveBeenCalledWith('OldPassword123', currentPasswordHash);
      expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword123', 12);
    });

    it('should throw BadRequestException for incorrect current password', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      // Act & Assert
      await expect(service.changePassword(1, changePasswordDto)).rejects.toThrow(BadRequestException);
    });

    it('should validate new password strength', async () => {
      // Arrange
      const weakPasswordDto = { ...changePasswordDto, newPassword: '123' };
      const userWithPassword = { ...mockUser, password: await bcrypt.hash('OldPassword123', 12) };
      mockUserRepository.findOne.mockResolvedValue(userWithPassword);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      // Act & Assert
      await expect(service.changePassword(1, weakPasswordDto)).rejects.toThrow(BusinessValidationException);
    });
  });

  describe('remove', () => {
    it('should soft delete user successfully', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue({ ...mockUser, deletedAt: new Date() });

      // Act
      await service.remove(1);

      // Assert
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when trying to delete admin user', async () => {
      // Arrange
      const adminUser = { ...mockUser, role: UserRole.ADMIN };
      mockUserRepository.findOne.mockResolvedValue(adminUser);

      // Act & Assert
      await expect(service.remove(1)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getStats', () => {
    it('should return user statistics', async () => {
      // Arrange
      mockUserRepository.count
        .mockResolvedValueOnce(100) // totalUsers
        .mockResolvedValueOnce(80)  // activeUsers
        .mockResolvedValueOnce(10)  // pendingUsers
        .mockResolvedValueOnce(5)   // suspendedUsers
        .mockResolvedValueOnce(2)   // newUsersToday
        .mockResolvedValueOnce(15)  // newUsersThisWeek
        .mockResolvedValueOnce(25); // newUsersThisMonth

      // Act
      const result = await service.getStats();

      // Assert
      expect(result).toEqual({
        totalUsers: 100,
        activeUsers: 80,
        pendingUsers: 10,
        suspendedUsers: 5,
        newUsersToday: 2,
        newUsersThisWeek: 15,
        newUsersThisMonth: 25,
      });
    });
  });

  describe('existsByEmail', () => {
    it('should return true when user exists', async () => {
      // Arrange
      mockUserRepository.count.mockResolvedValue(1);

      // Act
      const result = await service.existsByEmail('test@example.com');

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when user does not exist', async () => {
      // Arrange
      mockUserRepository.count.mockResolvedValue(0);

      // Act
      const result = await service.existsByEmail('notfound@example.com');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('updateStatus', () => {
    it('should update user status successfully', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue({ ...mockUser, status: UserStatus.SUSPENDED });

      // Act
      const result = await service.updateStatus(1, UserStatus.SUSPENDED);

      // Assert
      expect(result.status).toBe(UserStatus.SUSPENDED);
      expect(mockUserRepository.save).toHaveBeenCalled();
    });
  });

  describe('unlockAccount', () => {
    it('should unlock user account successfully', async () => {
      // Arrange
      const lockedUser = { 
        ...mockUser, 
        lockedUntil: new Date(),
        failedLoginAttempts: 5 
      };
      mockUserRepository.findOne.mockResolvedValue(lockedUser);
      mockUserRepository.save.mockResolvedValue({
        ...lockedUser,
        lockedUntil: undefined,
        failedLoginAttempts: 0
      });

      // Act
      await service.unlockAccount(1);

      // Assert
      expect(mockUserRepository.save).toHaveBeenCalled();
    });
  });
});
