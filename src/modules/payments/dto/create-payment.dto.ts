import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsObject,
  Min,
  Max,
  Length,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PaymentMethod, PaymentType } from '../entities/payment.entity';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'ID do usuário que realizará o pagamento',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'ID do plano a ser adquirido',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  planId?: string;

  @ApiProperty({
    description: 'Valor do pagamento em centavos',
    example: 2990,
    minimum: 1,
    maximum: 1000000000,
  })
  @IsNumber()
  @Min(1)
  @Max(1000000000) // R$ 10.000.000,00
  @Transform(({ value }) => parseInt(value))
  amount: number;

  @ApiProperty({
    description: 'Moeda do pagamento',
    example: 'BRL',
    default: 'BRL',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string = 'BRL';

  @ApiProperty({
    description: 'Método de pagamento',
    enum: PaymentMethod,
    example: PaymentMethod.STRIPE,
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description: 'Tipo de pagamento',
    enum: PaymentType,
    example: PaymentType.SUBSCRIPTION,
  })
  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @ApiProperty({
    description: 'Descrição do pagamento',
    example: 'Assinatura Premium - Mensal',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string;

  @ApiProperty({
    description: 'Data de vencimento do pagamento',
    example: '2025-08-14T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({
    description: 'Se o pagamento é recorrente',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean = false;

  @ApiProperty({
    description: 'Dados adicionais do pagamento',
    example: { installments: 1, discount: 0 },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class CreatePaymentIntentDto {
  @ApiProperty({
    description: 'ID do plano para criar intenção de pagamento',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  planId?: string;

  @ApiProperty({
    description: 'Valor customizado em centavos (se não for plano)',
    example: 2990,
    minimum: 1,
    maximum: 1000000000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000000000)
  @Transform(({ value }) => parseInt(value))
  amount?: number;

  @ApiProperty({
    description: 'Método de pagamento preferido',
    enum: PaymentMethod,
    example: PaymentMethod.STRIPE,
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description: 'URL de sucesso após o pagamento',
    example: 'https://app.neuralbook.app/payment/success',
    required: false,
  })
  @IsOptional()
  @IsString()
  successUrl?: string;

  @ApiProperty({
    description: 'URL de cancelamento do pagamento',
    example: 'https://app.neuralbook.app/payment/cancel',
    required: false,
  })
  @IsOptional()
  @IsString()
  cancelUrl?: string;

  @ApiProperty({
    description: 'Dados adicionais para o pagamento',
    example: { coupon: 'WELCOME10' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
