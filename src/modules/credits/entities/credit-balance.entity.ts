import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

/**
 * Entidade CreditBalance - Controle centralizado de saldos de créditos
 * 
 * @description Controla o saldo de créditos de cada usuário de forma centralizada
 * @author NeuralContent Team
 * @since 1.0.0
 * 
 * @features
 * - Controle de créditos mensais e extras
 * - Cálculo automático de saldos disponíveis
 * - Reset mensal automático
 * - Otimização para consultas frequentes
 * - Sincronização com CreditTransaction
 * 
 * @table crd_credit_balances - Alinhado com migration 007
 */
@Entity('crd_credit_balances')
@Index(['userId'], { unique: true })
@Index(['monthlyResetAt'])
export class CreditBalance {
  @ApiProperty({
    description: 'ID único do registro de saldo',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'ID único do usuário',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ApiProperty({
    description: 'Créditos mensais disponíveis no ciclo atual',
    example: 1000,
    minimum: 0,
  })
  @Column({
    name: 'monthly_credits',
    type: 'bigint',
    default: 0,
  })
  monthlyCredits: number;

  @ApiProperty({
    description: 'Créditos mensais já utilizados no ciclo atual',
    example: 250,
    minimum: 0,
  })
  @Column({
    name: 'monthly_used',
    type: 'bigint',
    default: 0,
  })
  monthlyUsed: number;

  @ApiProperty({
    description: 'Data do próximo reset mensal de créditos',
    example: '2025-08-13T12:00:00Z',
  })
  @Column({
    name: 'monthly_reset_at',
    type: 'timestamp',
  })
  monthlyResetAt: Date;

  @ApiProperty({
    description: 'Créditos extras disponíveis (não expiram mensalmente)',
    example: 500,
    minimum: 0,
  })
  @Column({
    name: 'extra_credits',
    type: 'bigint',
    default: 0,
  })
  extraCredits: number;

  @ApiProperty({
    description: 'Créditos extras já utilizados',
    example: 100,
    minimum: 0,
  })
  @Column({
    name: 'extra_used',
    type: 'bigint',
    default: 0,
  })
  extraUsed: number;

  @ApiProperty({
    description: 'Total de créditos ganhos pelo usuário (histórico)',
    example: 15000,
    minimum: 0,
  })
  @Column({
    name: 'total_earned',
    type: 'bigint',
    default: 0,
  })
  totalEarned: number;

  @ApiProperty({
    description: 'Total de créditos consumidos pelo usuário (histórico)',
    example: 12500,
    minimum: 0,
  })
  @Column({
    name: 'total_consumed',
    type: 'bigint',
    default: 0,
  })
  totalConsumed: number;

  @ApiProperty({
    description: 'Data de criação do registro',
    example: '2025-07-13T12:00:00Z',
  })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2025-07-13T12:00:00Z',
  })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ApiProperty({
    description: 'Usuário proprietário do saldo',
    type: () => User,
  })
  @OneToOne(() => User, (user) => user.creditBalance, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Computed properties
  @ApiProperty({
    description: 'Saldo total disponível (mensais + extras disponíveis)',
    example: 1150,
    minimum: 0,
  })
  get availableCredits(): number {
    const monthlyAvailable = Math.max(0, this.monthlyCredits - this.monthlyUsed);
    const extraAvailable = Math.max(0, this.extraCredits - this.extraUsed);
    return monthlyAvailable + extraAvailable;
  }

  @ApiProperty({
    description: 'Créditos mensais restantes no ciclo atual',
    example: 750,
    minimum: 0,
  })
  get monthlyAvailable(): number {
    return Math.max(0, this.monthlyCredits - this.monthlyUsed);
  }

  @ApiProperty({
    description: 'Créditos extras restantes',
    example: 400,
    minimum: 0,
  })
  get extraAvailable(): number {
    return Math.max(0, this.extraCredits - this.extraUsed);
  }

  @ApiProperty({
    description: 'Total de créditos utilizados (mensais + extras)',
    example: 350,
    minimum: 0,
  })
  get totalUsed(): number {
    return this.monthlyUsed + this.extraUsed;
  }

  @ApiProperty({
    description: 'Percentual de uso dos créditos mensais',
    example: 25.5,
    minimum: 0,
    maximum: 100,
  })
  get monthlyUsagePercentage(): number {
    if (this.monthlyCredits === 0) return 0;
    return Math.min(100, (this.monthlyUsed / this.monthlyCredits) * 100);
  }

  @ApiProperty({
    description: 'Se está próximo do limite mensal (>80%)',
    example: false,
  })
  get isNearMonthlyLimit(): boolean {
    return this.monthlyUsagePercentage > 80;
  }

  @ApiProperty({
    description: 'Se esgotou os créditos mensais',
    example: false,
  })
  get hasExhaustedMonthly(): boolean {
    return this.monthlyUsed >= this.monthlyCredits;
  }

  @ApiProperty({
    description: 'Se precisa de reset mensal (data ultrapassada)',
    example: false,
  })
  get needsMonthlyReset(): boolean {
    return new Date() >= this.monthlyResetAt;
  }

  @ApiProperty({
    description: 'Dias até o próximo reset mensal',
    example: 15,
    minimum: 0,
  })
  get daysUntilReset(): number {
    const now = new Date();
    const resetDate = new Date(this.monthlyResetAt);
    const diffTime = resetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  @ApiProperty({
    description: 'Estatísticas resumidas do saldo',
    example: {
      totalAvailable: 1150,
      monthlyAvailable: 750,
      extraAvailable: 400,
      usageRate: 25.5,
      daysUntilReset: 15,
    },
  })
  get summary() {
    return {
      totalAvailable: this.availableCredits,
      monthlyAvailable: this.monthlyAvailable,
      extraAvailable: this.extraAvailable,
      usageRate: this.monthlyUsagePercentage,
      daysUntilReset: this.daysUntilReset,
      isNearLimit: this.isNearMonthlyLimit,
      needsReset: this.needsMonthlyReset,
    };
  }

  // Utility methods
  /**
   * Verifica se tem créditos suficientes para uma operação
   */
  hasEnoughCredits(amount: number): boolean {
    return this.availableCredits >= amount;
  }

  /**
   * Calcula o próximo reset mensal baseado na data atual
   */
  calculateNextMonthlyReset(): Date {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1); // Primeiro dia do próximo mês
    nextMonth.setHours(0, 0, 0, 0); // Meia-noite
    return nextMonth;
  }

  /**
   * Reseta os créditos mensais (chamado pelo sistema automaticamente)
   */
  resetMonthlyCredits(newMonthlyCredits: number = this.monthlyCredits): void {
    this.monthlyUsed = 0;
    this.monthlyCredits = newMonthlyCredits;
    this.monthlyResetAt = this.calculateNextMonthlyReset();
  }

  /**
   * Adiciona créditos extras (compras, bônus, etc.)
   */
  addExtraCredits(amount: number): void {
    this.extraCredits += amount;
    this.totalEarned += amount;
  }

  /**
   * Consome créditos (prioriza mensais primeiro, depois extras)
   */
  consumeCredits(amount: number): { monthly: number; extra: number } {
    if (!this.hasEnoughCredits(amount)) {
      throw new Error('Insufficient credits');
    }

    let remaining = amount;
    let monthlyConsumed = 0;
    let extraConsumed = 0;

    // Primeiro consome créditos mensais
    const monthlyAvailable = this.monthlyAvailable;
    if (remaining > 0 && monthlyAvailable > 0) {
      monthlyConsumed = Math.min(remaining, monthlyAvailable);
      this.monthlyUsed += monthlyConsumed;
      remaining -= monthlyConsumed;
    }

    // Depois consome créditos extras se necessário
    const extraAvailableAmount = this.extraAvailable;
    if (remaining > 0 && extraAvailableAmount > 0) {
      extraConsumed = Math.min(remaining, extraAvailableAmount);
      this.extraUsed += extraConsumed;
      remaining -= extraConsumed;
    }

    // Atualiza total consumido
    this.totalConsumed += amount;

    return {
      monthly: monthlyConsumed,
      extra: extraConsumed,
    };
  }
}
