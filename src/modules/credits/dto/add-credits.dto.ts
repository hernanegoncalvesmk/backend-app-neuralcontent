import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsPositive,
  IsEnum,
  IsOptional,
  IsString,
  IsObject,
  IsUUID,
  IsIP,
  IsDateString,
  Min,
  Max,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreditTransactionType } from '../entities/credit-transaction.entity';

/**
 * DTO para adição de créditos
 */
export class AddCreditsDto {
  @ApiProperty({
    description: 'ID do usuário que receberá os créditos',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Quantidade de créditos a serem adicionados',
    example: 1000,
    minimum: 1,
    maximum: 100000,
  })
  @IsNotEmpty()
  @IsPositive()
  @Min(1)
  @Max(100000)
  @Type(() => Number)
  amount: number;

  @ApiProperty({
    description: 'Tipo da transação de adição',
    enum: [
      CreditTransactionType.GRANTED,
      CreditTransactionType.REFUNDED,
    ],
    example: CreditTransactionType.GRANTED,
  })
  @IsNotEmpty()
  @IsEnum([
    CreditTransactionType.GRANTED,
    CreditTransactionType.REFUNDED,
  ])
  type: CreditTransactionType;

  @ApiProperty({
    description: 'Descrição da adição de créditos',
    example: 'Compra de 1000 créditos via pagamento com cartão',
    maxLength: 500,
  })
  @IsNotEmpty()
  @IsString()
  @Length(1, 500)
  description: string;

  @ApiProperty({
    description: 'ID do pagamento relacionado (se aplicável)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  paymentId?: string;

  @ApiProperty({
    description: 'ID da sessão ou processo que originou a adição',
    example: 'session_12345',
    required: false,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  sessionId?: string;

  @ApiProperty({
    description: 'Data de expiração dos créditos (ISO string)',
    example: '2025-12-31T23:59:59.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiProperty({
    description: 'IP do cliente',
    example: '192.168.1.1',
    required: false,
  })
  @IsOptional()
  @IsIP()
  clientIp?: string;

  @ApiProperty({
    description: 'User agent do cliente',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  userAgent?: string;

  @ApiProperty({
    description: 'Metadados adicionais da transação',
    example: {
      source: 'payment_gateway',
      planId: 'plan_premium',
      promotionCode: 'WELCOME50',
      originalAmount: 1000,
      bonusAmount: 50,
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * DTO de resposta para adição de créditos
 */
export class AddCreditsResponseDto {
  @ApiProperty({
    description: 'Se a adição foi bem-sucedida',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'ID da transação criada',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  transactionId: string;

  @ApiProperty({
    description: 'Quantidade de créditos adicionados',
    example: 1000,
  })
  amountAdded: number;

  @ApiProperty({
    description: 'Saldo de créditos após a adição',
    example: 2000,
  })
  newBalance: number;

  @ApiProperty({
    description: 'Saldo anterior',
    example: 1000,
  })
  previousBalance: number;

  @ApiProperty({
    description: 'Data de expiração dos créditos adicionados',
    example: '2025-12-31T23:59:59.000Z',
    required: false,
  })
  expiresAt?: Date;

  @ApiProperty({
    description: 'Mensagem descritiva do resultado',
    example: 'Créditos adicionados com sucesso',
  })
  message: string;

  @ApiProperty({
    description: 'Timestamp da adição',
    example: '2025-07-14T10:15:00.000Z',
  })
  timestamp: Date;
}

/**
 * DTO para transferência de créditos entre usuários
 */
export class TransferCreditsDto {
  @ApiProperty({
    description: 'ID do usuário origem (que enviará os créditos)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  fromUserId: string;

  @ApiProperty({
    description: 'ID do usuário destino (que receberá os créditos)',
    example: '987fcdeb-51d3-4a2b-a456-426614174999',
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  toUserId: string;

  @ApiProperty({
    description: 'Quantidade de créditos a serem transferidos',
    example: 500,
    minimum: 1,
    maximum: 50000,
  })
  @IsNotEmpty()
  @IsPositive()
  @Min(1)
  @Max(50000)
  @Type(() => Number)
  amount: number;

  @ApiProperty({
    description: 'Descrição da transferência',
    example: 'Transferência de créditos para usuário premium',
    maxLength: 500,
  })
  @IsNotEmpty()
  @IsString()
  @Length(1, 500)
  description: string;

  @ApiProperty({
    description: 'Metadados adicionais da transferência',
    example: {
      reason: 'gift',
      giftMessage: 'Parabéns pela promoção!',
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * DTO de resposta para transferência de créditos
 */
export class TransferCreditsResponseDto {
  @ApiProperty({
    description: 'Se a transferência foi bem-sucedida',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'ID da transação de débito (usuário origem)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  debitTransactionId: string;

  @ApiProperty({
    description: 'ID da transação de crédito (usuário destino)',
    example: '987fcdeb-51d3-4a2b-a456-426614174999',
  })
  creditTransactionId: string;

  @ApiProperty({
    description: 'Quantidade transferida',
    example: 500,
  })
  amountTransferred: number;

  @ApiProperty({
    description: 'Saldo do usuário origem após a transferência',
    example: 1500,
  })
  fromUserNewBalance: number;

  @ApiProperty({
    description: 'Saldo do usuário destino após a transferência',
    example: 750,
  })
  toUserNewBalance: number;

  @ApiProperty({
    description: 'Mensagem descritiva do resultado',
    example: 'Transferência realizada com sucesso',
  })
  message: string;

  @ApiProperty({
    description: 'Timestamp da transferência',
    example: '2025-07-14T10:15:00.000Z',
  })
  timestamp: Date;
}
