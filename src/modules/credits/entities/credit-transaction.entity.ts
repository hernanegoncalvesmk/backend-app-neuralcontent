import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../database/base.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Tipos de transação de crédito
 */
export enum CreditTransactionType {
  PURCHASE = 'purchase',           // Compra de créditos
  CONSUMPTION = 'consumption',     // Consumo de créditos
  BONUS = 'bonus',                // Bônus de créditos
  REFUND = 'refund',              // Reembolso de créditos
  EXPIRATION = 'expiration',       // Expiração de créditos
  TRANSFER = 'transfer',          // Transferência entre usuários
  ADJUSTMENT = 'adjustment'        // Ajuste manual
}

/**
 * Status da transação de crédito
 */
export enum CreditTransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

/**
 * Serviços que consomem créditos
 */
export enum CreditServiceType {
  TEXT_GENERATION = 'text_generation',
  IMAGE_GENERATION = 'image_generation',
  TRANSLATION = 'translation',
  SUMMARIZATION = 'summarization',
  VOICE_SYNTHESIS = 'voice_synthesis',
  DOCUMENT_ANALYSIS = 'document_analysis',
  CUSTOM_SERVICE = 'custom_service'
}

/**
 * Entidade CreditTransaction - Transações de créditos no sistema
 * 
 * @description Controla todas as movimentações de créditos dos usuários
 * @author NeuralContent Team
 * @since 1.0.0
 * 
 * @features
 * - Rastreamento completo de transações
 * - Tipos diversos de movimentação
 * - Auditoria de uso por serviço
 * - Controle de saldo e expiração
 * - Metadata extensível para contexto
 */
@Entity('credit_transactions')
@Index(['userId', 'createdAt'])
@Index(['type', 'status'])
@Index(['serviceType'])
@Index(['expiresAt'])
@Index(['createdAt'])
export class CreditTransaction extends BaseEntity {
  @ApiProperty({
    description: 'ID do usuário proprietário da transação',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ type: 'varchar', length: 255, name: 'user_id' })
  userId: string;

  @ApiProperty({
    description: 'Tipo da transação de crédito',
    enum: CreditTransactionType,
    example: CreditTransactionType.CONSUMPTION,
  })
  @Column({
    type: 'enum',
    enum: CreditTransactionType,
  })
  type: CreditTransactionType;

  @ApiProperty({
    description: 'Status da transação',
    enum: CreditTransactionStatus,
    example: CreditTransactionStatus.COMPLETED,
  })
  @Column({
    type: 'enum',
    enum: CreditTransactionStatus,
    default: CreditTransactionStatus.PENDING,
  })
  status: CreditTransactionStatus;

  @ApiProperty({
    description: 'Quantidade de créditos na transação (positivo = entrada, negativo = saída)',
    example: -50,
    minimum: -999999,
    maximum: 999999,
  })
  @Column({ type: 'int' })
  amount: number;

  @ApiProperty({
    description: 'Saldo de créditos após a transação',
    example: 950,
    minimum: 0,
  })
  @Column({ type: 'int', unsigned: true, name: 'balance_after' })
  balanceAfter: number;

  @ApiProperty({
    description: 'Tipo de serviço que consumiu os créditos',
    enum: CreditServiceType,
    example: CreditServiceType.TEXT_GENERATION,
    required: false,
  })
  @Column({
    type: 'enum',
    enum: CreditServiceType,
    nullable: true,
    name: 'service_type',
  })
  serviceType?: CreditServiceType;

  @ApiProperty({
    description: 'ID da transação de pagamento relacionada',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'payment_id' })
  paymentId?: string;

  @ApiProperty({
    description: 'ID da sessão ou processo que originou a transação',
    example: 'session_12345',
    required: false,
  })
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'session_id' })
  sessionId?: string;

  @ApiProperty({
    description: 'Descrição da transação',
    example: 'Consumo de 50 créditos para geração de texto',
    maxLength: 500,
  })
  @Column({ type: 'varchar', length: 500 })
  description: string;

  @ApiProperty({
    description: 'Data de expiração dos créditos (se aplicável)',
    example: '2025-12-31T23:59:59.000Z',
    required: false,
  })
  @Column({ type: 'timestamp', nullable: true, name: 'expires_at' })
  expiresAt?: Date;

  @ApiProperty({
    description: 'IP do cliente que originou a transação',
    example: '192.168.1.1',
    required: false,
  })
  @Column({ type: 'varchar', length: 45, nullable: true, name: 'client_ip' })
  clientIp?: string;

  @ApiProperty({
    description: 'User agent do cliente',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    required: false,
  })
  @Column({ type: 'text', nullable: true, name: 'user_agent' })
  userAgent?: string;

  @ApiProperty({
    description: 'Metadados adicionais da transação em formato JSON',
    example: {
      requestId: 'req_12345',
      model: 'gpt-4',
      tokens: 1500,
      duration: 2.5,
    },
    required: false,
  })
  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Motivo do cancelamento ou falha',
    example: 'Saldo insuficiente',
    required: false,
  })
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'failure_reason' })
  failureReason?: string;

  @ApiProperty({
    description: 'Data de processamento da transação',
    example: '2025-07-14T10:15:00.000Z',
    required: false,
  })
  @Column({ type: 'timestamp', nullable: true, name: 'processed_at' })
  processedAt?: Date;

  @ApiProperty({
    description: 'Data de cancelamento da transação',
    example: '2025-07-14T10:15:00.000Z',
    required: false,
  })
  @Column({ type: 'timestamp', nullable: true, name: 'cancelled_at' })
  cancelledAt?: Date;

  // Relacionamentos
  @ManyToOne(() => User, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Computed properties
  @ApiProperty({
    description: 'Se a transação está pendente',
    example: false,
  })
  get isPending(): boolean {
    return this.status === CreditTransactionStatus.PENDING;
  }

  @ApiProperty({
    description: 'Se a transação foi completada',
    example: true,
  })
  get isCompleted(): boolean {
    return this.status === CreditTransactionStatus.COMPLETED;
  }

  @ApiProperty({
    description: 'Se a transação falhou',
    example: false,
  })
  get isFailed(): boolean {
    return this.status === CreditTransactionStatus.FAILED;
  }

  @ApiProperty({
    description: 'Se a transação foi cancelada',
    example: false,
  })
  get isCancelled(): boolean {
    return this.status === CreditTransactionStatus.CANCELLED;
  }

  @ApiProperty({
    description: 'Se é uma transação de entrada de créditos',
    example: false,
  })
  get isCredit(): boolean {
    return this.amount > 0;
  }

  @ApiProperty({
    description: 'Se é uma transação de saída de créditos',
    example: true,
  })
  get isDebit(): boolean {
    return this.amount < 0;
  }

  @ApiProperty({
    description: 'Se os créditos têm data de expiração',
    example: true,
  })
  get hasExpiration(): boolean {
    return Boolean(this.expiresAt);
  }

  @ApiProperty({
    description: 'Se os créditos estão expirados',
    example: false,
  })
  get isExpired(): boolean {
    return this.expiresAt ? new Date() > this.expiresAt : false;
  }

  @ApiProperty({
    description: 'Valor absoluto da quantidade de créditos',
    example: 50,
  })
  get absoluteAmount(): number {
    return Math.abs(this.amount);
  }
}
