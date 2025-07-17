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
  TRIAL = 'trial',
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  ANNUAL = 'annual',
  WEEKLY = 'weekly',
  LIFETIME = 'lifetime',
}

@Entity('pln_user_subscriptions')
@Index(['status'])
@Index(['userId'])
@Index(['planId'])
@Index(['stripeSubscriptionId'])
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
    description: 'ID da assinatura no Stripe',
    example: 'sub_1234567890',
  })
  @Column({
    type: 'varchar',
    length: 100,
    name: 'stripe_subscription_id',
    nullable: true,
    unique: true,
  })
  stripeSubscriptionId?: string;

  @ApiProperty({
    description: 'ID do cliente no Stripe',
    example: 'cus_1234567890',
  })
  @Column({
    type: 'varchar',
    length: 100,
    name: 'stripe_customer_id',
    nullable: true,
  })
  stripeCustomerId?: string;

  @ApiProperty({
    description: 'Data de início da assinatura',
    example: '2025-07-14T10:00:00.000Z',
  })
  @Column({ type: 'timestamp', name: 'start_date' })
  startDate: Date;

  @ApiProperty({
    description: 'Data de início do período atual',
    example: '2025-07-14T10:00:00.000Z',
  })
  @Column({ type: 'timestamp', name: 'current_period_start', nullable: true })
  currentPeriodStart?: Date;

  @ApiProperty({
    description: 'Data de fim do período atual',
    example: '2025-08-14T10:00:00.000Z',
  })
  @Column({ type: 'timestamp', name: 'current_period_end', nullable: true })
  currentPeriodEnd?: Date;

  @ApiProperty({
    description: 'Data de início do período de trial',
    example: '2025-07-14T10:00:00.000Z',
  })
  @Column({ type: 'timestamp', name: 'trial_start_date', nullable: true })
  trialStartDate?: Date;

  @ApiProperty({
    description: 'Data de fim do período de trial',
    example: '2025-07-21T10:00:00.000Z',
  })
  @Column({ type: 'timestamp', name: 'trial_end_date', nullable: true })
  trialEndDate?: Date;

  @ApiProperty({
    description: 'Se o usuário já utilizou o período de trial',
    example: false,
    default: false,
  })
  @Column({ type: 'boolean', name: 'is_trial_used', default: false })
  isTrialUsed: boolean;

  @ApiProperty({
    description: 'Data de cancelamento da assinatura',
    example: '2025-08-14T10:00:00.000Z',
  })
  @Column({ type: 'timestamp', name: 'cancelled_at', nullable: true })
  cancelledAt?: Date;

  @ApiProperty({
    description: 'Data da próxima cobrança',
    example: '2025-08-14T10:00:00.000Z',
  })
  @Column({ type: 'timestamp', name: 'next_billing_date', nullable: true })
  nextBillingDate?: Date;

  @ApiProperty({
    description: 'Preço pago pela assinatura',
    example: 29.9,
    minimum: 0,
  })
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'price_paid',
    nullable: true,
  })
  pricePaid?: number;

  @ApiProperty({
    description: 'Moeda da assinatura',
    example: 'BRL',
    default: 'BRL',
  })
  @Column({ type: 'varchar', length: 3, default: 'BRL' })
  currency: string;

  @ApiProperty({
    description: 'Créditos concedidos com esta assinatura',
    example: 1000,
    minimum: 0,
  })
  @Column({ type: 'int', unsigned: true, name: 'credits_granted', default: 0 })
  creditsGranted: number;

  @ApiProperty({
    description: 'Créditos utilizados nesta assinatura',
    example: 150,
    minimum: 0,
  })
  @Column({ type: 'int', unsigned: true, name: 'credits_used', default: 0 })
  creditsUsed: number;

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
    return Math.max(0, this.creditsGranted - this.creditsUsed);
  }

  @ApiProperty({
    description: 'Se a assinatura está expirada',
    example: false,
  })
  get isExpired(): boolean {
    return Boolean(this.currentPeriodEnd && new Date() > this.currentPeriodEnd);
  }

  @ApiProperty({
    description: 'Se a assinatura está em período de trial',
    example: false,
  })
  get isInTrial(): boolean {
    return Boolean(
      this.status === SubscriptionStatus.TRIAL &&
        this.trialEndDate &&
        new Date() < this.trialEndDate,
    );
  }
}
