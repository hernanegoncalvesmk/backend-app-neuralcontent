import { 
  Injectable, 
  NotFoundException, 
  ConflictException, 
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  Logger 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, Like, In, IsNull, Not } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

// DTOs
import { CreateUserDto, UserRole, UserStatus } from './dto/create-user.dto';
import { UpdateUserDto, ChangePasswordDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import {
  UserResponseDto,
  UserListResponseDto,
  UserStatsResponseDto,
} from './dto/user-response.dto';

// Entity
import { User } from './entities/user.entity';

// Services
import { UploadService, UploadedFileInfo } from '../upload/services/upload.service';
import { UploadFileDto, FileType, FileContext } from '../upload/dto/upload-file.dto';

// Custom Exceptions
import { 
  BusinessValidationException,
  ResourceNotFoundException 
} from '../../shared/exceptions/custom.exceptions';

export interface FindAllUsersOptions {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  sortBy?: 'email' | 'name' | 'createdAt' | 'lastLoginAt';
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * UsersService - Serviço de gestão de usuários
 * 
 * @description Implementa todas as operações CRUD e lógica de negócio 
 * relacionadas aos usuários do sistema NeuralContent
 * 
 * @author NeuralContent Team
 * @since 1.0.0
 * 
 * @features
 * - CRUD completo de usuários
 * - Validação de regras de negócio
 * - Gestão de senhas segura
 * - Auditoria e logs
 * - Busca avançada com filtros
 * - Estatísticas e relatórios
 * - Controle de status e roles
 * - Performance otimizada
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly saltRounds: number;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly uploadService: UploadService,
  ) {
    this.saltRounds = this.configService.get<number>('BCRYPT_ROUNDS', 12);
  }

  /**
   * Criar novo usuário
   * 
   * @param createUserDto - Dados para criar o usuário
   * @returns User criado
   * @throws ConflictException se email já existir
   * @throws BusinessValidationException se dados inválidos
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    this.logger.log(`Creating new user with email: ${createUserDto.email}`);

    try {
      // Verifica se o email já existe
      await this.validateEmailUniqueness(createUserDto.email);

      // Valida regras de negócio específicas
      await this.validateBusinessRules(createUserDto);

      // Hash da senha
      const hashedPassword = await this.hashPassword(createUserDto.password);

      // Cria o usuário com dados sanitizados
      const userData = this.sanitizeUserData(createUserDto);
      const newUser = this.userRepository.create({
        ...userData,
        password: hashedPassword,
        // Definir campos padrão
        status: UserStatus.PENDING,
        isEmailVerified: false,
        failedLoginAttempts: 0,
        termsAcceptedAt: new Date(),
      });

      const result = await this.userRepository.save(newUser);
      
      // TypeORM save pode retornar User ou User[] dependendo do input
      // Como estamos passando uma entidade única, fazemos cast para User
      const savedUser = result as unknown as User;
      
      this.logger.log(`User created successfully with ID: ${savedUser.id}`);
      return savedUser;

    } catch (error) {
      this.logger.error(`Failed to create user: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Buscar todos os usuários com filtros e paginação
   * 
   * @param options - Opções de busca e filtros
   * @returns Lista paginada de usuários
   */
  async findAll(options: FindAllUsersOptions = {}): Promise<UserListResponseDto> {
    this.logger.log('Fetching users with options:', JSON.stringify(options));

    const {
      page = 1,
      limit = 10,
      search,
      role,
      status,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = options;

    try {
      const queryBuilder = this.userRepository.createQueryBuilder('user')
        .where('user.deletedAt IS NULL'); // Apenas usuários não deletados

      // Aplicar filtros
      this.applySearchFilters(queryBuilder, { search, role, status });

      // Aplicar ordenação
      queryBuilder.orderBy(`user.${sortBy}`, sortOrder);

      // Aplicar paginação
      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);

      // Executar query
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

      this.logger.log(`Found ${total} users (page ${page}/${result.meta.totalPages})`);
      return result;

    } catch (error) {
      this.logger.error('Failed to fetch users:', error.message);
      throw new BusinessValidationException('Failed to fetch users');
    }
  }

  async findOne(id: number): Promise<User> {
    this.logger.log(`Finding user with ID: ${id}`);

    const user = await this.userRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!user) {
      this.logger.warn(`User not found with ID: ${id}`);
      throw new ResourceNotFoundException('User not found');
    }

    return user;
  }

  /**
   * Buscar usuário por email
   * 
   * @param email - Email do usuário
   * @returns User encontrado
   * @throws ResourceNotFoundException se não encontrado
   */
  async findByEmail(email: string): Promise<User> {
    this.logger.log(`Finding user with email: ${email}`);

    const user = await this.userRepository.findOne({
      where: { 
        email: email.toLowerCase().trim(),
        deletedAt: IsNull() 
      },
      select: ['id', 'email', 'name', 'role', 'status', 'password'], // Incluir password quando necessário
    });

    if (!user) {
      throw new ResourceNotFoundException('User not found');
    }

    return user;
  }

  /**
   * Buscar usuários por role
   * 
   * @param role - Role dos usuários
   * @returns Array de usuários
   */
  async findByRole(role: UserRole): Promise<User[]> {
    return this.userRepository.find({
      where: { 
        role,
        deletedAt: IsNull() 
      },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Buscar usuários ativos
   * 
   * @returns Array de usuários ativos
   */
  async findActiveUsers(): Promise<User[]> {
    return this.userRepository.find({
      where: { 
        status: UserStatus.ACTIVE,
        deletedAt: IsNull() 
      },
      order: { lastLoginAt: 'DESC' },
    });
  }

  /**
   * Atualizar usuário
   * 
   * @param id - ID do usuário
   * @param updateUserDto - Dados para atualização
   * @returns User atualizado
   * @throws ConflictException se email já existir
   * @throws ResourceNotFoundException se usuário não encontrado
   */
  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    this.logger.log(`Updating user with ID: ${id}`);

    try {
      const user = await this.findOne(id);

      // Se há um novo email, verifica se já não está em uso
      if (updateUserDto.email && updateUserDto.email !== user.email) {
        await this.validateEmailUniqueness(updateUserDto.email, id);
      }

      // Valida regras específicas de atualização
      await this.validateUpdateRules(user, updateUserDto);

      // Sanitiza e aplica os dados
      const sanitizedData = this.sanitizeUserData(updateUserDto);
      Object.assign(user, sanitizedData);
      user.updatedAt = new Date();

      const updatedUser = await this.userRepository.save(user);
      
      this.logger.log(`User updated successfully with ID: ${id}`);
      return updatedUser;

    } catch (error) {
      this.logger.error(`Failed to update user ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Alterar senha do usuário
   * 
   * @param id - ID do usuário
   * @param changePasswordDto - Dados da alteração
   * @throws BadRequestException se senha atual incorreta
   * @throws ResourceNotFoundException se usuário não encontrado
   */
  async changePassword(id: number, changePasswordDto: ChangePasswordDto): Promise<void> {
    this.logger.log(`Changing password for user ID: ${id}`);

    try {
      const user = await this.userRepository.findOne({
        where: { id, deletedAt: IsNull() },
        select: ['id', 'password'], // Incluir password explicitamente
      });

      if (!user) {
        throw new ResourceNotFoundException('User not found');
      }

      // Verifica a senha atual
      const isCurrentPasswordValid = await bcrypt.compare(
        changePasswordDto.currentPassword!,
        user.password,
      );

      if (!isCurrentPasswordValid) {
        this.logger.warn(`Invalid current password for user ID: ${id}`);
        throw new BadRequestException('Current password is incorrect');
      }

      // Validar força da nova senha
      this.validatePasswordStrength(changePasswordDto.newPassword);

      // Hash da nova senha
      const hashedPassword = await this.hashPassword(changePasswordDto.newPassword);

      // Atualizar a senha
      user.password = hashedPassword;
      user.updatedAt = new Date();

      await this.userRepository.save(user);
      
      this.logger.log(`Password changed successfully for user ID: ${id}`);

    } catch (error) {
      this.logger.error(`Failed to change password for user ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Remover usuário (soft delete)
   * 
   * @param id - ID do usuário
   * @throws ResourceNotFoundException se usuário não encontrado
   * @throws ForbiddenException se tentar deletar admin
   */
  async remove(id: number): Promise<void> {
    this.logger.log(`Removing user with ID: ${id}`);

    try {
      const user = await this.findOne(id);

      // Não permitir remoção de usuários admin
      if (user.role === UserRole.ADMIN) {
        throw new ForbiddenException('Cannot delete admin users');
      }

      // Soft delete
      user.deletedAt = new Date();
      user.status = UserStatus.INACTIVE;

      await this.userRepository.save(user);
      
      this.logger.log(`User removed successfully with ID: ${id}`);

    } catch (error) {
      this.logger.error(`Failed to remove user ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Obter estatísticas detalhadas dos usuários
   * 
   * @returns Estatísticas completas
   */
  async getStats(): Promise<UserStatsResponseDto> {
    this.logger.log('Generating user statistics');

    try {
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
        this.userRepository.count({ where: { deletedAt: IsNull() } }),
        this.userRepository.count({ where: { status: UserStatus.ACTIVE, deletedAt: IsNull() } }),
        this.userRepository.count({ where: { status: UserStatus.PENDING, deletedAt: IsNull() } }),
        this.userRepository.count({ where: { status: UserStatus.SUSPENDED, deletedAt: IsNull() } }),
        this.userRepository.count({ where: { createdAt: MoreThanOrEqual(today), deletedAt: IsNull() } }),
        this.userRepository.count({ where: { createdAt: MoreThanOrEqual(weekAgo), deletedAt: IsNull() } }),
        this.userRepository.count({ where: { createdAt: MoreThanOrEqual(monthAgo), deletedAt: IsNull() } }),
      ]);

      const stats = {
        totalUsers,
        activeUsers,
        pendingUsers,
        suspendedUsers,
        newUsersToday,
        newUsersThisWeek,
        newUsersThisMonth,
      };

      this.logger.log('User statistics generated successfully', JSON.stringify(stats));
      return stats;

    } catch (error) {
      this.logger.error('Failed to generate user statistics:', error.message);
      throw new BusinessValidationException('Failed to generate user statistics');
    }
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

  /**
   * Verificar se usuário existe por email
   * 
   * @param email - Email do usuário
   * @returns boolean indicando se existe
   */
  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.userRepository.count({
      where: { 
        email: email.toLowerCase().trim(),
        deletedAt: IsNull() 
      },
    });
    return count > 0;
  }

  /**
   * Contar usuários por status
   * 
   * @param status - Status dos usuários
   * @returns Número de usuários
   */
  async countByStatus(status: UserStatus): Promise<number> {
    return this.userRepository.count({
      where: { 
        status,
        deletedAt: IsNull() 
      },
    });
  }

  /**
   * Buscar usuários criados em período
   * 
   * @param startDate - Data inicial
   * @param endDate - Data final (opcional)
   * @returns Array de usuários
   */
  async findByDateRange(startDate: Date, endDate?: Date): Promise<User[]> {
    const where: any = {
      createdAt: MoreThanOrEqual(startDate),
      deletedAt: IsNull(),
    };

    if (endDate) {
      where.createdAt = {
        ...where.createdAt,
        $lte: endDate,
      };
    }

    return this.userRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Atualizar foto de perfil do usuário
   * 
   * @param userId - ID do usuário
   * @param fileInfo - Informações do arquivo de imagem
   * @returns User com profilePicture atualizado
   * @throws NotFoundException se usuário não existir
   * @throws BadRequestException se arquivo inválido
   */
  async updateProfilePicture(
    userId: number,
    fileInfo: UploadedFileInfo,
  ): Promise<User> {
    this.logger.log(`Updating profile picture for user ID: ${userId}`);

    try {
      // Buscar usuário existente
      const user = await this.findOne(userId);
      if (!user) {
        throw new ResourceNotFoundException('User', userId);
      }

      // Validar que é uma imagem
      const allowedImageTypes = [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/webp',
        'image/gif'
      ];

      if (!allowedImageTypes.includes(fileInfo.mimetype)) {
        throw new BadRequestException('Only image files are allowed for profile pictures');
      }

      // Validar tamanho (máximo 5MB para fotos de perfil)
      const maxProfilePictureSize = 5 * 1024 * 1024; // 5MB
      if (fileInfo.size > maxProfilePictureSize) {
        throw new BadRequestException('Profile picture must be smaller than 5MB');
      }

      // Upload da imagem usando o UploadService
      const uploadDto: UploadFileDto = {
        fileType: FileType.IMAGE,
        context: FileContext.AVATAR,
        processImage: true,
        generateThumbnail: true,
        maxWidth: 800,
        maxHeight: 800,
        quality: 85,
      };

      const uploadResult = await this.uploadService.uploadFile(
        fileInfo,
        uploadDto,
        user,
      );

      // Atualizar o campo profilePicture no usuário
      await this.userRepository.update(userId, {
        profilePicture: uploadResult.url,
      });

      // Buscar e retornar usuário atualizado
      const updatedUser = await this.findOne(userId);
      
      this.logger.log(`Profile picture updated successfully for user ID: ${userId}`);
      return updatedUser;

    } catch (error) {
      this.logger.error(`Error updating profile picture for user ID: ${userId}`, error.stack);
      
      if (error instanceof ResourceNotFoundException || 
          error instanceof BadRequestException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to update profile picture');
    }
  }

  // ===== MÉTODOS AUXILIARES PRIVADOS =====

  /**
   * Validar unicidade do email
   * 
   * @param email - Email a ser validado
   * @param excludeId - ID para excluir da validação (para updates)
   * @throws ConflictException se email já existir
   */
  private async validateEmailUniqueness(email: string, excludeId?: number): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();
    
    const query: any = {
      email: normalizedEmail,
      deletedAt: IsNull(),
    };

    if (excludeId) {
      query.id = Not(excludeId);
    }

    const existingUser = await this.userRepository.findOne({
      where: query,
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }
  }

  /**
   * Validar regras de negócio para criação
   * 
   * @param createUserDto - Dados para validação
   * @throws BusinessValidationException se regras violadas
   */
  private async validateBusinessRules(createUserDto: CreateUserDto): Promise<void> {
    // Validar força da senha
    this.validatePasswordStrength(createUserDto.password);

    // Validar se email é de domínio válido
    this.validateEmailDomain(createUserDto.email);

    // Outras validações específicas do negócio
    if (createUserDto.role === UserRole.ADMIN) {
      throw new ForbiddenException('Cannot create admin users directly');
    }
  }

  /**
   * Validar regras para atualização
   * 
   * @param user - Usuário atual
   * @param updateUserDto - Dados para atualização
   * @throws BusinessValidationException se regras violadas
   */
  private async validateUpdateRules(user: User, updateUserDto: UpdateUserDto): Promise<void> {
    // Não permitir alteração de role de admin
    if (user.role === UserRole.ADMIN && updateUserDto.role && updateUserDto.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Cannot change admin user role');
    }

    // Validar email se alterado
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      this.validateEmailDomain(updateUserDto.email);
    }
  }

  /**
   * Sanitizar dados do usuário
   * 
   * @param userData - Dados a serem sanitizados
   * @returns Dados sanitizados
   */
  private sanitizeUserData(userData: Partial<CreateUserDto | UpdateUserDto>): any {
    const sanitized: any = { ...userData };

    // Normalizar email
    if (sanitized.email) {
      sanitized.email = sanitized.email.toLowerCase().trim();
    }

    // Normalizar nome
    if (sanitized.name) {
      sanitized.name = sanitized.name.trim();
    }

    // Remover campos que não devem ser atualizados diretamente
    if ('password' in sanitized) {
      delete sanitized.password; // Senha deve ser tratada separadamente
    }

    return sanitized;
  }

  /**
   * Aplicar filtros de busca na query
   * 
   * @param queryBuilder - Query builder do TypeORM
   * @param filters - Filtros a serem aplicados
   */
  private applySearchFilters(queryBuilder: any, filters: any): void {
    const { search, role, status } = filters;

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
  }

  /**
   * Hash da senha com bcrypt
   * 
   * @param password - Senha em texto plano
   * @returns Hash da senha
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Validar força da senha
   * 
   * @param password - Senha a ser validada
   * @throws BusinessValidationException se senha fraca
   */
  private validatePasswordStrength(password: string): void {
    // Mínimo 8 caracteres, pelo menos 1 maiúscula, 1 minúscula, 1 número
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
    
    if (!passwordRegex.test(password)) {
      throw new BusinessValidationException(
        'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number'
      );
    }
  }

  /**
   * Validar domínio do email
   * 
   * @param email - Email a ser validado
   * @throws BusinessValidationException se domínio inválido
   */
  private validateEmailDomain(email: string): void {
    // Lista de domínios bloqueados (exemplo)
    const blockedDomains = ['tempmail.com', '10minutemail.com'];
    const emailDomain = email.split('@')[1]?.toLowerCase();

    if (blockedDomains.includes(emailDomain)) {
      throw new BusinessValidationException('Email domain is not allowed');
    }
  }
}
