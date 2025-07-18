import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { LoggerService } from '../../shared/logger/logger.service';
import { CreditTransaction, CreditTransactionType, CreditTransactionStatus, CreditServiceType } from './entities/credit-transaction.entity';
import { User } from '../users/entities/user.entity';
import {
  ConsumeCreditsDto,
  ConsumeCreditsResponseDto,
  ValidateCreditsDto,
  ValidateCreditsResponseDto,
  AddCreditsDto,
  AddCreditsResponseDto,
  TransferCreditsDto,
  TransferCreditsResponseDto,
} from './dto';

@Injectable()
export class CreditsService {
  constructor(
    @InjectRepository(CreditTransaction)
    private creditTransactionRepository: Repository<CreditTransaction>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
    private logger: LoggerService,
  ) {}

  /**
   * Valida se o usuário tem créditos suficientes para uma operação
   */
  async validateCredits(dto: ValidateCreditsDto): Promise<ValidateCreditsResponseDto> {
    try {
      this.logger.log(`Validating credits for user ${dto.userId}, amount: ${dto.amount}, service: ${dto.serviceType}`);

      const user = await this.userRepository.findOne({
        where: { id: parseInt(dto.userId) },
      });

      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }

      const balance = await this.getUserCreditBalance(dto.userId);
      const hasEnoughCredits = balance >= dto.amount;

      // Calcula custos baseados no tipo de serviço
      const serviceCost = this.calculateServiceCost(dto.serviceType, dto.amount);
      const hasEnoughForService = balance >= serviceCost;

      const response: ValidateCreditsResponseDto = {
        hasEnoughCredits: hasEnoughCredits && hasEnoughForService,
        currentBalance: balance,
        requiredAmount: dto.amount,
        serviceCost,
        remaining: balance - serviceCost,
        canProceed: hasEnoughCredits && hasEnoughForService && balance > 0,
        serviceType: dto.serviceType,
        message: hasEnoughCredits && hasEnoughForService 
          ? 'Créditos suficientes para a operação' 
          : 'Créditos insuficientes',
      };

      this.logger.log(`Credit validation result for user ${dto.userId}: ${JSON.stringify(response)}`);
      return response;
    } catch (error) {
      this.logger.error(`Error validating credits for user ${dto.userId}:`, error);
      throw error;
    }
  }

  /**
   * Consome créditos do usuário
   */
  async consumeCredits(dto: ConsumeCreditsDto): Promise<ConsumeCreditsResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.log(`Consuming credits for user ${dto.userId}, amount: ${dto.amount}, service: ${dto.serviceType}`);

      // Verifica se o usuário existe
      const user = await queryRunner.manager.findOne(User, {
        where: { id: parseInt(dto.userId) },
      });

      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }

      // Valida se tem créditos suficientes
      const validation = await this.validateCredits({
        userId: dto.userId,
        amount: dto.amount,
        serviceType: dto.serviceType,
      });

      if (!validation.canProceed) {
        throw new BadRequestException('Créditos insuficientes para a operação');
      }

      const serviceCost = this.calculateServiceCost(dto.serviceType, dto.amount);
      const previousBalance = await this.getUserCreditBalance(dto.userId);

      // Cria a transação de consumo
      const transaction = queryRunner.manager.create(CreditTransaction, {
        user,
        type: CreditTransactionType.CONSUMPTION,
        amount: -serviceCost, // Valor negativo para consumo
        balance: previousBalance - serviceCost,
        serviceType: dto.serviceType,
        description: dto.description,
        status: CreditTransactionStatus.COMPLETED,
        sessionId: dto.sessionId,
        clientIp: dto.clientIp,
        userAgent: dto.userAgent,
        metadata: {
          ...dto.metadata,
          originalAmount: dto.amount,
          serviceCost,
          consumedAt: new Date().toISOString(),
        },
      });

      const savedTransaction = await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();

      const response: ConsumeCreditsResponseDto = {
        success: true,
        transactionId: savedTransaction.id.toString(),
        amountConsumed: serviceCost,
        newBalance: previousBalance - serviceCost,
        previousBalance,
        serviceType: dto.serviceType,
        message: 'Créditos consumidos com sucesso',
        timestamp: savedTransaction.createdAt,
      };

      this.logger.log(`Credits consumed successfully for user ${dto.userId}: ${JSON.stringify(response)}`);
      return response;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error consuming credits for user ${dto.userId}:`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Adiciona créditos ao usuário
   */
  async addCredits(dto: AddCreditsDto): Promise<AddCreditsResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.log(`Adding credits for user ${dto.userId}, amount: ${dto.amount}, type: ${dto.type}`);

      // Verifica se o usuário existe
      const user = await queryRunner.manager.findOne(User, {
        where: { id: parseInt(dto.userId) },
      });

      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }

      const previousBalance = await this.getUserCreditBalance(dto.userId);
      const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : this.calculateDefaultExpiration();

      // Cria a transação de adição
      const transaction = queryRunner.manager.create(CreditTransaction, {
        user,
        type: dto.type,
        amount: dto.amount, // Valor positivo para adição
        balance: previousBalance + dto.amount,
        description: dto.description,
        status: CreditTransactionStatus.COMPLETED,
        sessionId: dto.sessionId,
        clientIp: dto.clientIp,
        userAgent: dto.userAgent,
        expiresAt,
        metadata: {
          ...dto.metadata,
          paymentId: dto.paymentId,
          addedAt: new Date().toISOString(),
        },
      });

      const savedTransaction = await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();

      const response: AddCreditsResponseDto = {
        success: true,
        transactionId: savedTransaction.id.toString(),
        amountAdded: dto.amount,
        newBalance: previousBalance + dto.amount,
        previousBalance,
        expiresAt,
        message: 'Créditos adicionados com sucesso',
        timestamp: savedTransaction.createdAt,
      };

      this.logger.log(`Credits added successfully for user ${dto.userId}: ${JSON.stringify(response)}`);
      return response;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error adding credits for user ${dto.userId}:`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Transfere créditos entre usuários
   */
  async transferCredits(dto: TransferCreditsDto): Promise<TransferCreditsResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.log(`Transferring credits from ${dto.fromUserId} to ${dto.toUserId}, amount: ${dto.amount}`);

      // Verifica se ambos os usuários existem
      const [fromUser, toUser] = await Promise.all([
        queryRunner.manager.findOne(User, { where: { id: parseInt(dto.fromUserId) } }),
        queryRunner.manager.findOne(User, { where: { id: parseInt(dto.toUserId) } }),
      ]);

      if (!fromUser) {
        throw new NotFoundException('Usuário origem não encontrado');
      }

      if (!toUser) {
        throw new NotFoundException('Usuário destino não encontrado');
      }

      if (dto.fromUserId === dto.toUserId) {
        throw new BadRequestException('Não é possível transferir créditos para o mesmo usuário');
      }

      // Verifica se o usuário origem tem créditos suficientes
      const fromUserBalance = await this.getUserCreditBalance(dto.fromUserId);
      if (fromUserBalance < dto.amount) {
        throw new BadRequestException('Créditos insuficientes para transferência');
      }

      const toUserBalance = await this.getUserCreditBalance(dto.toUserId);

      // Cria transação de débito (usuário origem)
      const debitTransaction = queryRunner.manager.create(CreditTransaction, {
        user: fromUser,
        type: CreditTransactionType.TRANSFER,
        amount: -dto.amount, // Valor negativo para débito
        balance: fromUserBalance - dto.amount,
        description: `${dto.description} (Envio para ${toUser.email})`,
        status: CreditTransactionStatus.COMPLETED,
        metadata: {
          ...dto.metadata,
          transferType: 'debit',
          toUserId: dto.toUserId,
          toUserEmail: toUser.email,
          transferredAt: new Date().toISOString(),
        },
      });

      // Cria transação de crédito (usuário destino)
      const creditTransaction = queryRunner.manager.create(CreditTransaction, {
        user: toUser,
        type: CreditTransactionType.TRANSFER,
        amount: dto.amount, // Valor positivo para crédito
        balance: toUserBalance + dto.amount,
        description: `${dto.description} (Recebido de ${fromUser.email})`,
        status: CreditTransactionStatus.COMPLETED,
        metadata: {
          ...dto.metadata,
          transferType: 'credit',
          fromUserId: dto.fromUserId,
          fromUserEmail: fromUser.email,
          transferredAt: new Date().toISOString(),
        },
      });

      const [savedDebitTransaction, savedCreditTransaction] = await Promise.all([
        queryRunner.manager.save(debitTransaction),
        queryRunner.manager.save(creditTransaction),
      ]);

      await queryRunner.commitTransaction();

      const response: TransferCreditsResponseDto = {
        success: true,
        debitTransactionId: savedDebitTransaction.id.toString(),
        creditTransactionId: savedCreditTransaction.id.toString(),
        amountTransferred: dto.amount,
        fromUserNewBalance: fromUserBalance - dto.amount,
        toUserNewBalance: toUserBalance + dto.amount,
        message: 'Transferência realizada com sucesso',
        timestamp: savedDebitTransaction.createdAt,
      };

      this.logger.log(`Credits transferred successfully: ${JSON.stringify(response)}`);
      return response;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error transferring credits:`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Obtém o saldo atual de créditos do usuário
   */
  async getUserCreditBalance(userId: string): Promise<number> {
    try {
      const result = await this.creditTransactionRepository
        .createQueryBuilder('transaction')
        .select('COALESCE(SUM(transaction.amount), 0)', 'balance')
        .where('transaction.userId = :userId', { userId: parseInt(userId) })
        .andWhere('transaction.status = :status', { status: CreditTransactionStatus.COMPLETED })
        .andWhere('(transaction.expiresAt IS NULL OR transaction.expiresAt > :now)', { now: new Date() })
        .getRawOne();

      return Math.max(0, parseInt(result.balance) || 0);
    } catch (error) {
      this.logger.error(`Error getting credit balance for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Obtém histórico de transações do usuário
   */
  async getUserTransactionHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<CreditTransaction[]> {
    try {
      return await this.creditTransactionRepository.find({
        where: { user: { id: parseInt(userId) } },
        order: { createdAt: 'DESC' },
        take: limit,
        skip: offset,
        relations: ['user'],
      });
    } catch (error) {
      this.logger.error(`Error getting transaction history for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Calcula o custo do serviço baseado no tipo
   */
  private calculateServiceCost(serviceType: CreditServiceType, amount: number): number {
    const serviceMultipliers: Record<CreditServiceType, number> = {
      [CreditServiceType.TEXT_GENERATION]: 1,
      [CreditServiceType.IMAGE_GENERATION]: 2,
      [CreditServiceType.TRANSLATION]: 1,
      [CreditServiceType.SUMMARIZATION]: 1,
      [CreditServiceType.VOICE_SYNTHESIS]: 2,
      [CreditServiceType.DOCUMENT_ANALYSIS]: 1,
      [CreditServiceType.CUSTOM_SERVICE]: 1,
    };

    const multiplier = serviceMultipliers[serviceType] || 1;
    return Math.ceil(amount * multiplier);
  }

  /**
   * Calcula data de expiração padrão (1 ano)
   */
  private calculateDefaultExpiration(): Date {
    const expiration = new Date();
    expiration.setFullYear(expiration.getFullYear() + 1);
    return expiration;
  }

  /**
   * Remove créditos expirados (método para execução via cron)
   */
  async removeExpiredCredits(): Promise<number> {
    try {
      this.logger.log('Removing expired credits');

      const expiredTransactions = await this.creditTransactionRepository.find({
        where: {
          expiresAt: { /* LessThan */ } as any, // TypeORM LessThan operator
          status: CreditTransactionStatus.COMPLETED,
        },
      });

      if (expiredTransactions.length === 0) {
        return 0;
      }

      // Marca transações como canceladas (não existe status EXPIRED)
      await this.creditTransactionRepository.update(
        { id: { /* In */ } as any }, // TypeORM In operator
        { status: CreditTransactionStatus.CANCELLED },
      );

      this.logger.log(`Removed ${expiredTransactions.length} expired credit transactions`);
      return expiredTransactions.length;
    } catch (error) {
      this.logger.error('Error removing expired credits:', error);
      throw error;
    }
  }
}
