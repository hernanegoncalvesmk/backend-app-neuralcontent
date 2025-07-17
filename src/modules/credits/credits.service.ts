import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { LoggerService } from '../../shared/logger/logger.service';
import { CreditTransaction, CreditTransactionType } from './entities/credit-transaction.entity';
import { CreditBalance } from './entities/credit-balance.entity';
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
  CreateCreditBalanceDto,
  UpdateCreditBalanceDto,
  CreditBalanceResponseDto,
} from './dto';

@Injectable()
export class CreditsService {
  constructor(
    @InjectRepository(CreditTransaction)
    private creditTransactionRepository: Repository<CreditTransaction>,
    @InjectRepository(CreditBalance)
    private creditBalanceRepository: Repository<CreditBalance>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
    private readonly logger: LoggerService,
  ) {}

  // CreditBalance Management
  async createCreditBalance(
    userId: string,
    createCreditBalanceDto: CreateCreditBalanceDto,
  ): Promise<CreditBalanceResponseDto> {
    this.logger.log(`Creating credit balance for user ${userId}`);

    try {
      // Convert userId string to number for compatibility with User entity
      const userIdNumber = parseInt(userId, 10);
      const user = await this.userRepository.findOne({ where: { id: userIdNumber } });
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      const existingBalance = await this.creditBalanceRepository.findOne({
        where: { userId }
      });

      if (existingBalance) {
        throw new ConflictException(
          `Credit balance already exists for user ${userId}`
        );
      }

      const creditBalance = this.creditBalanceRepository.create({
        ...createCreditBalanceDto,
      });

      const savedBalance = await this.creditBalanceRepository.save(creditBalance);

      return {
        id: savedBalance.id,
        userId: savedBalance.userId,
        monthlyCredits: savedBalance.monthlyCredits,
        monthlyUsed: savedBalance.monthlyUsed,
        monthlyResetAt: savedBalance.monthlyResetAt,
        extraCredits: savedBalance.extraCredits,
        extraUsed: savedBalance.extraUsed,
        totalConsumed: savedBalance.totalUsed,
        createdAt: savedBalance.createdAt,
        updatedAt: savedBalance.updatedAt,
        monthlyAvailable: 0, // will be calculated by transform
        extraAvailable: 0, // will be calculated by transform
        totalAvailable: 0, // will be calculated by transform
        monthlyUsagePercent: 0, // will be calculated by transform
        daysUntilReset: 0, // will be calculated by transform
        balanceStatus: 'low', // will be calculated by transform
      };
    } catch (error) {
      this.logger.error(`Error creating credit balance: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateCreditBalance(
    userId: string,
    updateCreditBalanceDto: UpdateCreditBalanceDto,
  ): Promise<CreditBalanceResponseDto> {
    this.logger.log(`Updating credit balance for user ${userId}`);

    try {
      const creditBalance = await this.creditBalanceRepository.findOne({
        where: { userId }
      });

      if (!creditBalance) {
        throw new NotFoundException(
          `Credit balance not found for user ${userId}`
        );
      }

      Object.assign(creditBalance, updateCreditBalanceDto);
      const savedBalance = await this.creditBalanceRepository.save(creditBalance);

      return {
        id: savedBalance.id,
        userId: savedBalance.userId,
        monthlyCredits: savedBalance.monthlyCredits,
        monthlyUsed: savedBalance.monthlyUsed,
        monthlyResetAt: savedBalance.monthlyResetAt,
        extraCredits: savedBalance.extraCredits,
        extraUsed: savedBalance.extraUsed,
        totalConsumed: savedBalance.totalUsed,
        createdAt: savedBalance.createdAt,
        updatedAt: savedBalance.updatedAt,
        monthlyAvailable: 0, // will be calculated by transform
        extraAvailable: 0, // will be calculated by transform
        totalAvailable: 0, // will be calculated by transform
        monthlyUsagePercent: 0, // will be calculated by transform
        daysUntilReset: 0, // will be calculated by transform
        balanceStatus: 'low', // will be calculated by transform
      };
    } catch (error) {
      this.logger.error(`Error updating credit balance: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getCreditBalance(userId: string): Promise<CreditBalanceResponseDto> {
    this.logger.log(`Getting credit balance for user ${userId}`);

    try {
      const creditBalance = await this.creditBalanceRepository.findOne({
        where: { userId }
      });

      if (!creditBalance) {
        throw new NotFoundException(
          `Credit balance not found for user ${userId}`
        );
      }

      return {
        id: creditBalance.id,
        userId: creditBalance.userId,
        monthlyCredits: creditBalance.monthlyCredits,
        monthlyUsed: creditBalance.monthlyUsed,
        monthlyResetAt: creditBalance.monthlyResetAt,
        extraCredits: creditBalance.extraCredits,
        extraUsed: creditBalance.extraUsed,
        totalConsumed: creditBalance.totalUsed,
        createdAt: creditBalance.createdAt,
        updatedAt: creditBalance.updatedAt,
        monthlyAvailable: 0, // will be calculated by transform
        extraAvailable: 0, // will be calculated by transform
        totalAvailable: 0, // will be calculated by transform
        monthlyUsagePercent: 0, // will be calculated by transform
        daysUntilReset: 0, // will be calculated by transform
        balanceStatus: 'low', // will be calculated by transform
      };
    } catch (error) {
      this.logger.error(`Error getting credit balance: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deleteCreditBalance(userId: string): Promise<void> {
    this.logger.log(`Deleting credit balance for user ${userId}`);

    try {
      const creditBalance = await this.creditBalanceRepository.findOne({
        where: { userId }
      });

      if (!creditBalance) {
        throw new NotFoundException(
          `Credit balance not found for user ${userId}`
        );
      }

      await this.creditBalanceRepository.remove(creditBalance);
    } catch (error) {
      this.logger.error(`Error deleting credit balance: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Original existing methods for credit operations
  async validateCredits(
    userId: string,
    validateCreditsDto: ValidateCreditsDto,
  ): Promise<ValidateCreditsResponseDto> {
    this.logger.log(`Validating credits for user ${userId}`);

    try {
      // Convert userId string to number for compatibility with User entity
      const userIdNumber = parseInt(userId, 10);
      const user = await this.userRepository.findOne({ where: { id: userIdNumber } });
      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }

      // Check credit balance from CreditBalance entity if available, fallback to user.creditBalance
      let userCredits = 0;
      try {
        const creditBalance = await this.creditBalanceRepository.findOne({
          where: { userId }
        });
        userCredits = creditBalance ? creditBalance.availableCredits : 0;
      } catch {
        // Fallback to legacy creditBalance relationship if CreditBalance table query doesn't exist
        userCredits = user.creditBalance?.availableCredits || 0;
      }

      const requiredCredits = validateCreditsDto.amount;
      const hasEnoughCredits = userCredits >= requiredCredits;

      return {
        hasEnoughCredits,
        currentBalance: userCredits,
        requiredAmount: requiredCredits,
        serviceCost: requiredCredits,
        remaining: Math.max(0, userCredits - requiredCredits),
        message: hasEnoughCredits 
          ? 'Créditos suficientes' 
          : `Créditos insuficientes. Necessário: ${requiredCredits}, Disponível: ${userCredits}`,
      };
    } catch (error) {
      this.logger.error(`Error validating credits: ${error.message}`, error.stack);
      throw error;
    }
  }

  async consumeCredits(
    userId: string,
    consumeCreditsDto: ConsumeCreditsDto,
  ): Promise<ConsumeCreditsResponseDto> {
    this.logger.log(`Consuming credits for user ${userId}`, 'CreditsService');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verificar se o usuário existe
      const user = await queryRunner.manager.findOne(User, { where: { id: userId } });
      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }

      const requiredCredits = consumeCreditsDto.amount;
      const currentCredits = user.creditsBalance || 0;

      // Verificar se há créditos suficientes
      if (currentCredits < requiredCredits) {
        throw new BadRequestException('Créditos insuficientes para a operação');
      }

      // Atualizar o saldo do usuário
      const newBalance = currentCredits - requiredCredits;
      await queryRunner.manager.update(User, userId, { creditsBalance: newBalance });

      // Criar registro da transação
      const transaction = queryRunner.manager.create(CreditTransaction, {
        user,
        type: CreditTransactionType.CONSUMPTION,
        amount: -requiredCredits,
        balanceAfter: newBalance,
        description: consumeCreditsDto.description || 'Consumo de créditos',
        metadata: consumeCreditsDto.metadata,
      });

      const savedTransaction = await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();

      return {
        transactionId: savedTransaction.id,
        previousBalance: currentCredits,
        newBalance,
        amountConsumed: requiredCredits,
        success: true,
        message: 'Créditos consumidos com sucesso',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error consuming credits: ${error.message}`, error.stack, 'CreditsService');
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async addCredits(
    userId: string,
    addCreditsDto: AddCreditsDto,
  ): Promise<AddCreditsResponseDto> {
    this.logger.log(`Adding credits for user ${userId}`, 'CreditsService');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verificar se o usuário existe
      const user = await queryRunner.manager.findOne(User, { where: { id: userId } });
      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }

      const creditsToAdd = addCreditsDto.amount;
      const currentCredits = user.creditsBalance || 0;
      const newBalance = currentCredits + creditsToAdd;

      // Atualizar o saldo do usuário
      await queryRunner.manager.update(User, userId, { creditsBalance: newBalance });

      // Criar registro da transação
      const transaction = queryRunner.manager.create(CreditTransaction, {
        user,
        type: CreditTransactionType.PURCHASE,
        amount: creditsToAdd,
        balanceAfter: newBalance,
        description: addCreditsDto.description || 'Adição de créditos',
        metadata: addCreditsDto.metadata,
      });

      const savedTransaction = await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();

      return {
        transactionId: savedTransaction.id,
        previousBalance: currentCredits,
        newBalance,
        amountAdded: creditsToAdd,
        success: true,
        message: 'Créditos adicionados com sucesso',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error adding credits: ${error.message}`, error.stack, 'CreditsService');
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async transferCredits(
    fromUserId: string,
    transferCreditsDto: TransferCreditsDto,
  ): Promise<TransferCreditsResponseDto> {
    this.logger.log(`Transferring credits from user ${fromUserId} to ${transferCreditsDto.toUserId}`, 'CreditsService');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verificar se ambos os usuários existem
      const fromUser = await queryRunner.manager.findOne(User, { where: { id: fromUserId } });
      if (!fromUser) {
        throw new NotFoundException('Usuário origem não encontrado');
      }

      const toUser = await queryRunner.manager.findOne(User, { where: { id: transferCreditsDto.toUserId } });
      if (!toUser) {
        throw new NotFoundException('Usuário destino não encontrado');
      }

      if (fromUserId === transferCreditsDto.toUserId) {
        throw new BadRequestException('Não é possível transferir créditos para o mesmo usuário');
      }

      const transferAmount = transferCreditsDto.amount;
      const fromUserCurrentCredits = fromUser.creditsBalance || 0;

      if (fromUserCurrentCredits < transferAmount) {
        throw new BadRequestException('Créditos insuficientes para transferência');
      }

      const toUserCurrentCredits = toUser.creditsBalance || 0;

      // Atualizar saldos
      const fromUserNewBalance = fromUserCurrentCredits - transferAmount;
      const toUserNewBalance = toUserCurrentCredits + transferAmount;

      await queryRunner.manager.update(User, fromUserId, { creditsBalance: fromUserNewBalance });
      await queryRunner.manager.update(User, transferCreditsDto.toUserId, { creditsBalance: toUserNewBalance });

      // Criar transações para ambos os usuários
      const fromTransaction = queryRunner.manager.create(CreditTransaction, {
        user: fromUser,
        type: CreditTransactionType.TRANSFER_OUT,
        amount: -transferAmount,
        balanceAfter: fromUserNewBalance,
        description: transferCreditsDto.description || `Transferência para ${toUser.email}`,
        metadata: { ...transferCreditsDto.metadata, transferToUserId: transferCreditsDto.toUserId },
      });

      const toTransaction = queryRunner.manager.create(CreditTransaction, {
        user: toUser,
        type: CreditTransactionType.TRANSFER_IN,
        amount: transferAmount,
        balanceAfter: toUserNewBalance,
        description: transferCreditsDto.description || `Transferência de ${fromUser.email}`,
        metadata: { ...transferCreditsDto.metadata, transferFromUserId: fromUserId },
      });

      const [savedFromTransaction, savedToTransaction] = await queryRunner.manager.save([
        fromTransaction,
        toTransaction,
      ]);

      await queryRunner.commitTransaction();

      return {
        fromTransactionId: savedFromTransaction.id,
        toTransactionId: savedToTransaction.id,
        fromUserId,
        toUserId: transferCreditsDto.toUserId,
        amount: transferAmount,
        fromUserPreviousBalance: fromUserCurrentCredits,
        fromUserNewBalance: fromUserNewBalance,
        toUserPreviousBalance: toUserCurrentCredits,
        toUserNewBalance: toUserNewBalance,
        success: true,
        message: 'Transferência realizada com sucesso',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error transferring credits: ${error.message}`, error.stack, 'CreditsService');
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getUserCreditBalance(userId: string): Promise<number> {
    this.logger.log(`Getting credit balance for user ${userId}`, 'CreditsService');

    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }

      return user.creditsBalance || 0;
    } catch (error) {
      this.logger.error(`Error getting user credit balance: ${error.message}`, error.stack, 'CreditsService');
      throw error;
    }
  }

  async getCreditTransactionHistory(
    userId: string,
    limit = 10,
    offset = 0,
  ): Promise<CreditTransaction[]> {
    this.logger.log(`Getting credit transaction history for user ${userId}`, 'CreditsService');

    try {
      const transactions = await this.creditTransactionRepository.find({
        where: { user: { id: userId } },
        order: { createdAt: 'DESC' },
        take: limit,
        skip: offset,
        relations: ['user'],
      });

      return transactions;
    } catch (error) {
      this.logger.error(`Error getting credit transaction history: ${error.message}`, error.stack, 'CreditsService');
      throw error;
    }
  }
}
