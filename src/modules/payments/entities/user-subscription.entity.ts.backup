import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { Plan } from '../../plans/entities/plan.entity';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
  TRIALING = 'trialing',
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  ANNUAL = 'annual',
  WEEKLY = 'weekly',
  LIFETIME = 'lifetime',
}

@Entity('pay_user_subscriptions')
@Index(['status'])
@Index(['userId'])
@Index(['planId'])
@Index(['externalSubscriptionId'])
@Index(['currentPeriodEnd'])
export class UserSubscription {
  @ApiProperty({
    description: 'ID único da assinatura',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'ID do usuário da assinatura',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ApiProperty({
    description: 'ID do plano da assinatura',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ type: 'uuid', name: 'plan_id' })
  planId: string;

  @ApiProperty({
    description: 'Status da assinatura',
    enum: SubscriptionStatus,
    example: SubscriptionStatus.ACTIVE,
  })
  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.PENDING,
  })
  status: SubscriptionStatus;

  @ApiProperty({
    description: 'Ciclo de cobrança da assinatura',
    enum: BillingCycle,
    example: BillingCycle.MONTHLY,
  })
  @Column({
    type: 'enum',
    enum: BillingCycle,
    name: 'billing_cycle',
  })
  billingCycle: BillingCycle;

  @ApiProperty({
    description: 'ID da assinatura no provedor externo',
    example: 'sub_1234567890',
  })
  @Column({
    type: 'varchar',
    length: 255,
    name: 'external_subscription_id',
    nullable: true,
  })
  externalSubscriptionId?: string;

  @ApiProperty({
    description: 'Data de início da assinatura',
    example: '2025-07-14T10:00:00.000Z',
  })
  @Column({ type: 'datetime', name: 'start_date' })
  startDate: Date;

  @ApiProperty({
    description: 'Data de fim do período atual',
    example: '2025-08-14T10:00:00.000Z',
  })
  @Column({ type: 'datetime', name: 'current_period_start' })
  currentPeriodStart: Date;

  @ApiProperty({
    description: 'Data de fim do período atual',
    example: '2025-08-14T10:00:00.000Z',
  })
  @Column({ type: 'datetime', name: 'current_period_end' })
  currentPeriodEnd: Date;

  @ApiProperty({
    description: 'Data de cancelamento da assinatura',
    example: '2025-08-14T10:00:00.000Z',
  })
  @Column({ type: 'datetime', name: 'cancelled_at', nullable: true })
  cancelledAt?: Date;

  @ApiProperty({
    description: 'Data de fim da assinatura',
    example: '2025-08-14T10:00:00.000Z',
  })
  @Column({ type: 'datetime', name: 'ended_at', nullable: true })
  endedAt?: Date;

  @ApiProperty({
    description: 'Data da próxima cobrança',
    example: '2025-08-14T10:00:00.000Z',
  })
  @Column({ type: 'datetime', name: 'next_billing_date', nullable: true })
  nextBillingDate?: Date;

  @ApiProperty({
    description: 'Valor da assinatura em centavos',
    example: 2990,
    minimum: 0,
  })
  @Column({ type: 'int', unsigned: true })
  amount: number;

  @ApiProperty({
    description: 'Moeda da assinatura',
    example: 'BRL',
    default: 'BRL',
  })
  @Column({ type: 'varchar', length: 3, default: 'BRL' })
  currency: string;

  @ApiProperty({
    description: 'Quantidade de créditos por período',
    example: 1000,
    minimum: 0,
  })
  @Column({ type: 'int', unsigned: true, name: 'credits_per_period', default: 0 })
  creditsPerPeriod: number;

  @ApiProperty({
    description: 'Créditos utilizados no período atual',
    example: 150,
    minimum: 0,
  })
  @Column({ type: 'int', unsigned: true, name: 'credits_used', default: 0 })
  creditsUsed: number;

  @ApiProperty({
    description: 'Se a assinatura é de teste',
    example: false,
    default: false,
  })
  @Column({ type: 'boolean', name: 'is_trial', default: false })
  isTrial: boolean;

  @ApiProperty({
    description: 'Data de fim do período de teste',
    example: '2025-07-21T10:00:00.000Z',
  })
  @Column({ type: 'datetime', name: 'trial_end', nullable: true })
  trialEnd?: Date;

  @ApiProperty({
    description: 'Se a renovação automática está ativa',
    example: true,
    default: true,
  })
  @Column({ type: 'boolean', name: 'auto_renew', default: true })
  autoRenew: boolean;

  @ApiProperty({
    description: 'Dados adicionais da assinatura em formato JSON',
    example: { discount: 10, coupon: 'WELCOME10' },
  })
  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Data de criação do registro',
    example: '2025-07-14T10:00:00.000Z',
  })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização do registro',
    example: '2025-07-14T10:30:00.000Z',
  })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relacionamentos
  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Plan, { 
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  // Computed properties
  @ApiProperty({
    description: 'Créditos restantes no período atual',
    example: 850,
  })
  get creditsRemaining(): number {
    return Math.max(0, this.creditsPerPeriod - this.creditsUsed);
  }

  @ApiProperty({
    description: 'Se a assinatura está expirada',
    example: false,
  })
  get isExpired(): boolean {
    return new Date() > this.currentPeriodEnd;
  }

  @ApiProperty({
    description: 'Se a assinatura está em período de teste',
    example: false,
  })
  get isInTrial(): boolean {
    return Boolean(this.isTrial && this.trialEnd && new Date() < this.trialEnd);
  }
}
