import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../database/base.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Tipos de transação de crédito - Alinhado com migration 008
 */
export enum CreditTransactionType {
  GRANTED = 'granted',         // Créditos concedidos
  USED = 'used',              // Créditos utilizados
  REFUNDED = 'refunded',      // Reembolso de créditos
  EXPIRED = 'expired'         // Expiração de créditos
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
@Entity('crd_credit_transactions')
@Index(['userId', 'createdAt'])
@Index(['type'])
@Index(['createdAt'])
@Index(['expiresAt'])
export class CreditTransaction extends BaseEntity {
  @ApiProperty({
    description: 'ID do usuário proprietário da transação',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ApiProperty({
    description: 'Tipo da transação de crédito',
    enum: CreditTransactionType,
    example: CreditTransactionType.USED,
  })
  @Column({
    type: 'enum',
    enum: CreditTransactionType,
  })
  type: CreditTransactionType;

  @ApiProperty({
    description: 'Quantidade de créditos na transação (positivo para granted/refunded, negativo para used)',
    example: -50,
  })
  @Column({ type: 'int' })
  amount: number;

  @ApiProperty({
    description: 'Descrição da transação',
    example: 'Consumo de 50 créditos para geração de texto',
    maxLength: 255,
  })
  @Column({ type: 'varchar', length: 255 })
  description: string;

  @ApiProperty({
    description: 'Tipo da entidade relacionada',
    example: 'subscription',
    required: false,
  })
  @Column({ 
    type: 'varchar', 
    length: 50, 
    nullable: true, 
    name: 'related_entity_type' 
  })
  relatedEntityType?: string;

  @ApiProperty({
    description: 'ID da entidade relacionada',
    example: 123,
    required: false,
  })
  @Column({ type: 'int', nullable: true, name: 'related_entity_id' })
  relatedEntityId?: number;

  @ApiProperty({
    description: 'Saldo de créditos antes da transação',
    example: 1000,
    minimum: 0,
  })
  @Column({ type: 'int', unsigned: true, name: 'balance_before' })
  balanceBefore: number;

  @ApiProperty({
    description: 'Saldo de créditos após a transação',
    example: 950,
    minimum: 0,
  })
  @Column({ type: 'int', unsigned: true, name: 'balance_after' })
  balanceAfter: number;

  @ApiProperty({
    description: 'Data de expiração dos créditos (se aplicável)',
    example: '2025-12-31T23:59:59.000Z',
    required: false,
  })
  @Column({ type: 'timestamp', nullable: true, name: 'expires_at' })
  expiresAt?: Date;

  // Relacionamentos
  @ManyToOne(() => User, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Computed properties
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
