import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto, UserRole, UserStatus } from './dto/create-user.dto';
import { UpdateUserDto, ChangePasswordDto } from './dto/update-user.dto';
import {
  UserResponseDto,
  UserListResponseDto,
  UserStatsResponseDto,
} from './dto/user-response.dto';
import { User } from './entities/user.entity';

export interface FindAllUsersOptions {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  sortBy?: 'email' | 'name' | 'createdAt' | 'lastLoginAt';
  sortOrder?: 'ASC' | 'DESC';
}

@Injectable()
export class UsersService {
  private readonly saltRounds = 12;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Verifica se o email já existe
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(createUserDto.password, this.saltRounds);

    // Cria o usuário
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return this.userRepository.save(user);
  }

  async findAll(options: FindAllUsersOptions = {}): Promise<UserListResponseDto> {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      status,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = options;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    // Filtros
    if (search) {
      queryBuilder.andWhere(
        '(user.name ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    if (status) {
      queryBuilder.andWhere('user.status = :status', { status });
    }

    // Ordenação
    queryBuilder.orderBy(`user.${sortBy}`, sortOrder);

    // Paginação
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [users, total] = await queryBuilder.getManyAndCount();

    const result: UserListResponseDto = {
      data: users.map(user => new UserResponseDto(user)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    return result;
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // Se há um novo email, verifica se já não está em uso
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Email already in use');
      }
    }

    // Atualiza o usuário (removendo a parte de senha, pois UpdateUserDto não tem password)
    Object.assign(user, updateUserDto);
    user.updatedAt = new Date();

    return this.userRepository.save(user);
  }

  async changePassword(id: number, changePasswordDto: ChangePasswordDto): Promise<void> {
    const user = await this.findOne(id);

    // Verifica a senha atual
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword!,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, this.saltRounds);

    // Atualiza a senha
    user.password = hashedPassword;
    user.updatedAt = new Date();

    await this.userRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    user.deletedAt = new Date();
    await this.userRepository.save(user);
  }

  async getStats(): Promise<UserStatsResponseDto> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

    const [
      totalUsers,
      activeUsers,
      pendingUsers,
      suspendedUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
    ] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { status: UserStatus.ACTIVE } }),
      this.userRepository.count({ where: { status: UserStatus.PENDING } }),
      this.userRepository.count({ where: { status: UserStatus.SUSPENDED } }),
      this.userRepository.count({ where: { createdAt: MoreThanOrEqual(today) } }),
      this.userRepository.count({ where: { createdAt: MoreThanOrEqual(weekAgo) } }),
      this.userRepository.count({ where: { createdAt: MoreThanOrEqual(monthAgo) } }),
    ]);

    return {
      totalUsers: totalUsers,
      activeUsers: activeUsers,
      pendingUsers: pendingUsers,
      suspendedUsers: suspendedUsers,
      newUsersToday: newUsersToday,
      newUsersThisWeek: newUsersThisWeek,
      newUsersThisMonth: newUsersThisMonth,
    };
  }

  async getUserStats(): Promise<UserStatsResponseDto> {
    return this.getStats();
  }

  async updateStatus(id: number, status: UserStatus): Promise<User> {
    const user = await this.findOne(id);
    user.status = status;
    user.updatedAt = new Date();
    return this.userRepository.save(user);
  }

  async unlockAccount(id: number): Promise<void> {
    const user = await this.findOne(id);
    
    user.lockedUntil = undefined;
    user.failedLoginAttempts = 0;
    user.updatedAt = new Date();

    await this.userRepository.save(user);
  }
}
