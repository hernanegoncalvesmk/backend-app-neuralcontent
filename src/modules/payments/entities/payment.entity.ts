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

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PROCESSING = 'processing',
}

export enum PaymentMethod {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  CREDIT_CARD = 'credit_card',
  PIX = 'pix',
  BANK_TRANSFER = 'bank_transfer',
}

export enum PaymentType {
  SUBSCRIPTION = 'subscription',
  ONE_TIME = 'one_time',
  CREDITS = 'credits',
  UPGRADE = 'upgrade',
  RENEWAL = 'renewal',
}

@Entity('pay_payments')
@Index(['status'])
@Index(['paymentMethod'])
@Index(['userId'])
@Index(['planId'])
@Index(['externalPaymentId'])
@Index(['createdAt'])
export class Payment {
  @ApiProperty({
    description: 'ID único do pagamento',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'ID do usuário que realizou o pagamento',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ApiProperty({
    description: 'ID do plano adquirido',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @Column({ type: 'uuid', name: 'plan_id', nullable: true })
  planId?: string;

  @ApiProperty({
    description: 'Valor do pagamento em centavos',
    example: 2990,
    minimum: 0,
  })
  @Column({ type: 'int', unsigned: true })
  amount: number;

  @ApiProperty({
    description: 'Moeda do pagamento',
    example: 'BRL',
    default: 'BRL',
  })
  @Column({ type: 'varchar', length: 3, default: 'BRL' })
  currency: string;

  @ApiProperty({
    description: 'Status do pagamento',
    enum: PaymentStatus,
    example: PaymentStatus.PENDING,
  })
  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @ApiProperty({
    description: 'Método de pagamento utilizado',
    enum: PaymentMethod,
    example: PaymentMethod.STRIPE,
  })
  @Column({
    type: 'enum',
    enum: PaymentMethod,
    name: 'payment_method',
  })
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description: 'Tipo de pagamento',
    enum: PaymentType,
    example: PaymentType.SUBSCRIPTION,
  })
  @Column({
    type: 'enum',
    enum: PaymentType,
    name: 'payment_type',
  })
  paymentType: PaymentType;

  @ApiProperty({
    description: 'ID do pagamento no provedor externo (Stripe, PayPal, etc.)',
    example: 'pi_1234567890',
  })
  @Column({
    type: 'varchar',
    length: 255,
    name: 'external_payment_id',
    nullable: true,
  })
  externalPaymentId?: string;

  @ApiProperty({
    description: 'ID da sessão de checkout no provedor externo',
    example: 'cs_1234567890',
  })
  @Column({
    type: 'varchar',
    length: 255,
    name: 'external_session_id',
    nullable: true,
  })
  externalSessionId?: string;

  @ApiProperty({
    description: 'Descrição do pagamento',
    example: 'Assinatura Premium - Mensal',
  })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({
    description: 'Data de vencimento do pagamento',
    example: '2025-08-14T00:00:00.000Z',
  })
  @Column({ type: 'datetime', name: 'due_date', nullable: true })
  dueDate?: Date;

  @ApiProperty({
    description: 'Data de processamento do pagamento',
    example: '2025-07-14T10:30:00.000Z',
  })
  @Column({ type: 'datetime', name: 'processed_at', nullable: true })
  processedAt?: Date;

  @ApiProperty({
    description: 'Motivo da falha/cancelamento',
    example: 'Cartão insuficiente',
  })
  @Column({ type: 'text', name: 'failure_reason', nullable: true })
  failureReason?: string;

  @ApiProperty({
    description: 'Dados adicionais do pagamento em formato JSON',
    example: { installments: 1, discount: 0 },
  })
  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Se o pagamento é recorrente',
    example: false,
    default: false,
  })
  @Column({ type: 'boolean', name: 'is_recurring', default: false })
  isRecurring: boolean;

  @ApiProperty({
    description: 'Data de confirmação do pagamento',
    example: '2025-07-14T10:15:00.000Z',
    required: false,
  })
  @Column({ type: 'timestamp', name: 'confirmed_at', nullable: true })
  confirmedAt?: Date;

  @ApiProperty({
    description: 'Data de cancelamento do pagamento',
    example: '2025-07-14T10:15:00.000Z',
    required: false,
  })
  @Column({ type: 'timestamp', name: 'cancelled_at', nullable: true })
  cancelledAt?: Date;

  @ApiProperty({
    description: 'Valor total reembolsado em centavos',
    example: 0,
    minimum: 0,
  })
  @Column({ type: 'int', unsigned: true, name: 'refunded_amount', default: 0 })
  refundedAmount: number;

  @ApiProperty({
    description: 'Resposta completa do gateway de pagamento',
    example: {},
    required: false,
  })
  @Column({ type: 'json', name: 'gateway_response', nullable: true })
  gatewayResponse?: any;

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
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Plan, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'plan_id' })
  plan?: Plan;
}
