import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * Enum para motivos de cancelamento
 */
export enum CancellationReason {
  USER_REQUESTED = 'user_requested',
  PAYMENT_FAILED = 'payment_failed',
  ADMIN_ACTION = 'admin_action',
  SYSTEM_AUTOMATED = 'system_automated',
  TRIAL_EXPIRED = 'trial_expired',
  PLAN_DISCONTINUED = 'plan_discontinued',
  FRAUD_DETECTED = 'fraud_detected',
  OTHER = 'other',
}

/**
 * DTO para cancelamento de assinatura
 *
 * @description Valida dados para cancelamento de assinatura de usuário
 * @author NeuralContent Team
 * @since 1.0.0
 */
export class CancelSubscriptionDto {
  @ApiProperty({
    description: 'ID da assinatura a ser cancelada',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({
    message: 'ID da assinatura é obrigatório',
  })
  @IsString({
    message: 'ID da assinatura deve ser uma string',
  })
  @IsUUID(4, {
    message: 'ID da assinatura deve ser um UUID válido',
  })
  subscriptionId: string;

  @ApiProperty({
    description: 'Motivo do cancelamento',
    enum: CancellationReason,
    example: CancellationReason.USER_REQUESTED,
  })
  @IsEnum(CancellationReason, {
    message: 'Motivo deve ser um valor válido',
  })
  reason: CancellationReason;

  @ApiPropertyOptional({
    description: 'Detalhes adicionais sobre o cancelamento',
    example: 'Usuario não ficou satisfeito com o serviço',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({
    message: 'Detalhes deve ser uma string',
  })
  @Transform(({ value }) => value?.trim())
  details?: string;

  @ApiPropertyOptional({
    description: 'Se deve cancelar imediatamente ou no fim do período',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({
    message: 'Cancelamento imediato deve ser verdadeiro ou falso',
  })
  @Transform(({ value }) => value === 'true' || value === true)
  cancelImmediately?: boolean = false;

  @ApiPropertyOptional({
    description: 'Data específica para cancelamento (se não imediato)',
    example: '2025-08-17T00:00:00Z',
  })
  @IsOptional()
  @IsDateString(
    {},
    {
      message: 'Data de cancelamento deve ser uma data válida',
    },
  )
  cancelAt?: string;

  @ApiPropertyOptional({
    description: 'Se deve reembolsar pagamentos pendentes',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({
    message: 'Reembolso deve ser verdadeiro ou falso',
  })
  @Transform(({ value }) => value === 'true' || value === true)
  shouldRefund?: boolean = false;

  @ApiPropertyOptional({
    description: 'Se deve preservar créditos restantes',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({
    message: 'Preservar créditos deve ser verdadeiro ou falso',
  })
  @Transform(({ value }) => value === 'true' || value === true)
  preserveCredits?: boolean = true;

  @ApiPropertyOptional({
    description: 'Feedback do usuário sobre o cancelamento',
    example: 'Encontrei uma alternativa mais barata',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({
    message: 'Feedback deve ser uma string',
  })
  @Transform(({ value }) => value?.trim())
  userFeedback?: string;
}

/**
 * DTO de resposta para cancelamento de assinatura
 *
 * @description Retorna informações sobre o cancelamento realizado
 * @author NeuralContent Team
 * @since 1.0.0
 */
export class CancelSubscriptionResponseDto {
  @ApiProperty({
    description: 'Se o cancelamento foi bem-sucedido',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'ID da assinatura cancelada',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  subscriptionId: string;

  @ApiProperty({
    description: 'Status atual da assinatura após cancelamento',
    example: 'canceled',
  })
  currentStatus: string;

  @ApiProperty({
    description: 'Data efetiva do cancelamento',
    example: '2025-07-17T12:00:00Z',
  })
  canceledAt: Date;

  @ApiProperty({
    description: 'Data até quando a assinatura permanece ativa',
    example: '2025-08-17T00:00:00Z',
  })
  activeUntil: Date;

  @ApiProperty({
    description: 'Créditos restantes preservados',
    example: 850,
  })
  creditsPreserved: number;

  @ApiProperty({
    description: 'Se houve reembolso processado',
    example: false,
  })
  refundProcessed: boolean;

  @ApiProperty({
    description: 'Valor do reembolso em centavos (se aplicável)',
    example: 0,
  })
  refundAmount: number;

  @ApiProperty({
    description: 'Mensagem de confirmação',
    example:
      'Assinatura cancelada com sucesso. Você pode continuar usando os recursos até 17/08/2025.',
  })
  message: string;

  @ApiProperty({
    description: 'Timestamp da operação',
    example: '2025-07-17T12:00:00Z',
  })
  timestamp: Date;
}
