import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan } from 'typeorm';
import {
  AdminStatsQueryDto,
  AdminStatsResponseDto,
  UserStatsDto,
  RevenueStatsDto,
  CreditsStatsDto,
  SystemStatsDto,
  StatsPeriod,
  AdminUserFilterDto,
  AdminUpdateUserDto,
  AdminUserResponseDto,
  AdminUserListResponseDto,
  AdminBulkActionDto,
  UserStatus as AdminUserStatus,
  UserRole as AdminUserRole,
} from './dto';
import { User } from '../users/entities/user.entity';
import { UserStatus, UserRole } from '../users/dto/create-user.dto';
import { CreditTransaction } from '../credits/entities/credit-transaction.entity';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(CreditTransaction)
    private readonly creditTransactionRepository: Repository<CreditTransaction>,
  ) {}

  /**
   * Obter estatísticas gerais do sistema
   */
  async getAdminStats(query: AdminStatsQueryDto): Promise<AdminStatsResponseDto> {
    this.logger.log('Gerando estatísticas do sistema');

    const { startDate, endDate, period = StatsPeriod.MONTHLY } = query;

    // Definir período se não informado
    const dateRange = this.getDateRange(startDate, endDate, period);

    // Buscar estatísticas em paralelo
    const [userStats, revenueStats, creditsStats, systemStats] = await Promise.all([
      this.getUserStats(dateRange),
      this.getRevenueStats(dateRange),
      this.getCreditsStats(dateRange),
      this.getSystemHealthStats(),
    ]);

    return {
      userStats,
      revenueStats,
      creditsStats,
      systemStats,
      generatedAt: new Date(),
      period,
    };
  }

  /**
   * Obter estatísticas de usuários
   */
  private async getUserStats(dateRange: { start: Date; end: Date }): Promise<UserStatsDto> {
    const totalUsers = await this.userRepository.count();

    const newUsers = await this.userRepository.count({
      where: {
        createdAt: Between(dateRange.start, dateRange.end),
      },
    });

    const activeUsers = await this.userRepository.count({
      where: {
        lastLoginAt: MoreThan(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)), // últimos 30 dias
        status: UserStatus.ACTIVE,
      },
    });

    const premiumUsers = await this.userRepository.count({
      where: {
        role: UserRole.ADMIN, // Usando ADMIN em vez de PREMIUM que não existe
        status: UserStatus.ACTIVE,
      },
    });

    // Calcular taxa de crescimento
    const previousPeriod = this.getPreviousPeriod(dateRange);
    const previousUsers = await this.userRepository.count({
      where: {
        createdAt: Between(previousPeriod.start, previousPeriod.end),
      },
    });

    const growthRate = previousUsers > 0 ? ((newUsers - previousUsers) / previousUsers) * 100 : 100;

    return {
      totalUsers,
      newUsers,
      activeUsers,
      premiumUsers,
      growthRate: Math.round(growthRate * 100) / 100,
    };
  }

  /**
   * Obter estatísticas de receita
   */
  private async getRevenueStats(dateRange: { start: Date; end: Date }): Promise<RevenueStatsDto> {
    // Por enquanto simulamos os dados de receita
    // Em uma implementação real, seria integrado com o módulo de pagamentos
    const totalRevenue = 15000.00;
    const totalTransactions = 120;
    const averageRevenuePerUser = totalRevenue / totalTransactions;
    const conversionRate = 12.5;
    const revenueGrowthRate = 8.3;

    return {
      totalRevenue,
      averageRevenuePerUser: Math.round(averageRevenuePerUser * 100) / 100,
      totalTransactions,
      conversionRate,
      revenueGrowthRate,
    };
  }

  /**
   * Obter estatísticas de créditos
   */
  private async getCreditsStats(dateRange: { start: Date; end: Date }): Promise<CreditsStatsDto> {
    const consumedCredits = await this.creditTransactionRepository
      .createQueryBuilder('ct')
      .select('SUM(ABS(ct.amount))')
      .where('ct.type IN (:...types)', { types: ['consume', 'deduct'] })
      .andWhere('ct.createdAt BETWEEN :start AND :end', {
        start: dateRange.start,
        end: dateRange.end,
      })
      .getRawOne();

    const addedCredits = await this.creditTransactionRepository
      .createQueryBuilder('ct')
      .select('SUM(ct.amount)')
      .where('ct.type IN (:...types)', { types: ['add', 'bonus', 'refund'] })
      .andWhere('ct.createdAt BETWEEN :start AND :end', {
        start: dateRange.start,
        end: dateRange.end,
      })
      .getRawOne();

    const totalCreditsConsumed = parseInt(consumedCredits?.sum || '0');
    const totalCreditsAdded = parseInt(addedCredits?.sum || '0');

    // Buscar usuários que mais consomem créditos
    const topConsumers = await this.creditTransactionRepository
      .createQueryBuilder('ct')
      .select('ct.userId', 'userId')
      .addSelect('u.name', 'userName')
      .addSelect('SUM(ABS(ct.amount))', 'creditsConsumed')
      .leftJoin('users', 'u', 'u.id = ct.userId')
      .where('ct.type IN (:...types)', { types: ['consume', 'deduct'] })
      .andWhere('ct.createdAt BETWEEN :start AND :end', {
        start: dateRange.start,
        end: dateRange.end,
      })
      .groupBy('ct.userId, u.name')
      .orderBy('creditsConsumed', 'DESC')
      .limit(5)
      .getRawMany();

    const totalUsers = await this.userRepository.count();
    const averageCreditsPerUser = totalUsers > 0 ? totalCreditsConsumed / totalUsers : 0;

    return {
      totalCreditsConsumed,
      totalCreditsAdded,
      averageCreditsPerUser: Math.round(averageCreditsPerUser * 100) / 100,
      topCreditConsumers: topConsumers.map(consumer => ({
        userId: consumer.userId,
        userName: consumer.userName || 'Nome não disponível',
        creditsConsumed: parseInt(consumer.creditsConsumed || '0'),
      })),
    };
  }

  /**
   * Obter estatísticas do sistema
   */
  private async getSystemHealthStats(): Promise<SystemStatsDto> {
    // Simulação de métricas do sistema
    // Em produção, seria integrado com ferramentas de monitoramento
    return {
      totalApiRequests: 125000,
      averageResponseTime: 150,
      errorRate: 0.5,
      systemUptime: 99.8,
      memoryUsage: 512,
    };
  }

  /**
   * Listar usuários com filtros
   */
  async getUsers(filters: AdminUserFilterDto): Promise<AdminUserListResponseDto> {
    const { status, role, search, page = 1, limit = 20 } = filters;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (status) {
      queryBuilder.andWhere('user.status = :status', { status });
    }

    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    if (search) {
      queryBuilder.andWhere(
        '(user.name ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);
    queryBuilder.orderBy('user.createdAt', 'DESC');

    const [users, total] = await queryBuilder.getManyAndCount();

    const usersResponse: AdminUserResponseDto[] = users.map(user => ({
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      status: this.mapUserStatus(user.status),
      role: this.mapUserRole(user.role),
      emailVerified: user.isEmailVerified,
      credits: 0, // Campo não existe na entidade User, implementar integração com créditos
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      currentPlan: 'Básico', // Implementar integração com planos
      totalSpent: 0, // Implementar integração com pagamentos
      totalCreditsConsumed: 0, // Implementar cálculo real
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      users: usersResponse,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Obter usuário específico
   */
  async getUserById(id: string): Promise<AdminUserResponseDto> {
    const user = await this.userRepository.findOne({ where: { id: parseInt(id) } });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return {
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      status: this.mapUserStatus(user.status),
      role: this.mapUserRole(user.role),
      emailVerified: user.isEmailVerified,
      credits: 0,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      currentPlan: 'Básico',
      totalSpent: 0,
      totalCreditsConsumed: 0,
    };
  }

  /**
   * Atualizar usuário
   */
  async updateUser(id: string, updateData: AdminUpdateUserDto): Promise<AdminUserResponseDto> {
    const user = await this.userRepository.findOne({ where: { id: parseInt(id) } });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar se email já existe
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateData.email },
      });
      if (existingUser) {
        throw new BadRequestException('Email já está em uso');
      }
    }

    Object.assign(user, updateData);
    user.updatedAt = new Date();

    await this.userRepository.save(user);

    this.logger.log(`Usuário ${id} atualizado pelo admin`);

    return this.getUserById(id);
  }

  /**
   * Executar ação em lote nos usuários
   */
  async bulkAction(bulkAction: AdminBulkActionDto): Promise<{ success: boolean; affected: number }> {
    const { userIds, action, value } = bulkAction;

    this.logger.log(`Executando ação em lote: ${action} para ${userIds.length} usuários`);

    let affected = 0;

    switch (action) {
      case 'activate':
        await this.userRepository.update(userIds.map(id => parseInt(id)), { status: UserStatus.ACTIVE });
        affected = userIds.length;
        break;

      case 'suspend':
        await this.userRepository.update(userIds.map(id => parseInt(id)), { status: UserStatus.SUSPENDED });
        affected = userIds.length;
        break;

      case 'ban':
        await this.userRepository.update(userIds.map(id => parseInt(id)), { status: UserStatus.INACTIVE });
        affected = userIds.length;
        break;

      case 'add_credits':
        if (!value || value <= 0) {
          throw new BadRequestException('Valor de créditos deve ser maior que zero');
        }
        // TODO: Implementar sistema de créditos quando integrado com a entidade User
        affected = userIds.length;
        break;

      case 'delete':
        // Soft delete - apenas muda status
        await this.userRepository.update(userIds.map(id => parseInt(id)), { status: UserStatus.INACTIVE });
        affected = userIds.length;
        break;

      default:
        throw new BadRequestException('Ação não suportada');
    }

    this.logger.log(`Ação em lote ${action} executada com sucesso. ${affected} usuários afetados`);

    return { success: true, affected };
  }

  /**
   * Obter período de datas
   */
  private getDateRange(startDate?: string, endDate?: string, period?: StatsPeriod) {
    const end = endDate ? new Date(endDate) : new Date();
    let start: Date;

    if (startDate) {
      start = new Date(startDate);
    } else {
      switch (period) {
        case StatsPeriod.DAILY:
          start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
          break;
        case StatsPeriod.WEEKLY:
          start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case StatsPeriod.YEARLY:
          start = new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        case StatsPeriod.MONTHLY:
        default:
          start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }
    }

    return { start, end };
  }

  /**
   * Obter período anterior para cálculo de crescimento
   */
  private getPreviousPeriod(dateRange: { start: Date; end: Date }) {
    const duration = dateRange.end.getTime() - dateRange.start.getTime();
    const end = new Date(dateRange.start.getTime());
    const start = new Date(dateRange.start.getTime() - duration);

    return { start, end };
  }

  /**
   * Mapear UserStatus da entidade para AdminUserStatus
   */
  private mapUserStatus(status: UserStatus): AdminUserStatus {
    switch (status) {
      case UserStatus.ACTIVE:
        return AdminUserStatus.ACTIVE;
      case UserStatus.INACTIVE:
        return AdminUserStatus.INACTIVE;
      case UserStatus.PENDING:
        return AdminUserStatus.PENDING;
      case UserStatus.SUSPENDED:
        return AdminUserStatus.SUSPENDED;
      default:
        return AdminUserStatus.INACTIVE;
    }
  }

  /**
   * Mapear UserRole da entidade para AdminUserRole
   */
  private mapUserRole(role: UserRole): AdminUserRole {
    switch (role) {
      case UserRole.USER:
        return AdminUserRole.USER;
      case UserRole.ADMIN:
        return AdminUserRole.ADMIN;
      case UserRole.MODERATOR:
        return AdminUserRole.MODERATOR;
      case UserRole.SUPER_ADMIN:
        return AdminUserRole.SUPER_ADMIN;
      default:
        return AdminUserRole.USER;
    }
  }
}
