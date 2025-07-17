import { PartialType } from '@nestjs/swagger';
import { CreateUserSubscriptionDto } from './create-user-subscription.dto';
import { SubscriptionStatus } from '../entities/user-subscription.entity';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  IsObject,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * DTO para atualização de assinatura de usuário
 *
 * @description Valida dados para atualização de assinatura existente.
 * Herda todas as propriedades de CreateUserSubscriptionDto como opcionais.
 * @author NeuralContent Team
 * @since 1.0.0
 */
export class UpdateUserSubscriptionDto extends PartialType(
  CreateUserSubscriptionDto,
) {
  @ApiPropertyOptional({
    description: 'ID da assinatura (readonly para identificação)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    readOnly: true,
  })
  @IsOptional()
  @IsString()
  readonly id?: string;

  @ApiPropertyOptional({
    description: 'Novo status da assinatura',
    enum: SubscriptionStatus,
    example: SubscriptionStatus.CANCELLED,
  })
  @IsOptional()
  @IsEnum(SubscriptionStatus, {
    message: 'Status deve ser um valor válido',
  })
  status?: SubscriptionStatus;

  @ApiPropertyOptional({
    description: 'Nova data de início do período',
    example: '2025-08-17T00:00:00Z',
  })
  @IsOptional()
  @IsDateString(
    {},
    {
      message: 'Data de início deve ser uma data válida',
    },
  )
  currentPeriodStart?: string;

  @ApiPropertyOptional({
    description: 'Nova data de fim do período',
    example: '2025-09-17T00:00:00Z',
  })
  @IsOptional()
  @IsDateString(
    {},
    {
      message: 'Data de fim deve ser uma data válida',
    },
  )
  currentPeriodEnd?: string;

  @ApiPropertyOptional({
    description: 'Atualizar créditos concedidos',
    example: 2000,
    minimum: 0,
    maximum: 1000000,
  })
  @IsOptional()
  @IsNumber(
    {},
    {
      message: 'Créditos concedidos deve ser um número',
    },
  )
  @Min(0, {
    message: 'Créditos concedidos deve ser maior ou igual a zero',
  })
  @Max(1000000, {
    message: 'Créditos concedidos deve ser menor que 1.000.000',
  })
  @Transform(({ value }) => Number(value))
  creditsGranted?: number;

  @ApiPropertyOptional({
    description: 'Atualizar créditos utilizados',
    example: 150,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber(
    {},
    {
      message: 'Créditos usados deve ser um número',
    },
  )
  @Min(0, {
    message: 'Créditos usados deve ser maior ou igual a zero',
  })
  @Transform(({ value }) => Number(value))
  creditsUsed?: number;

  @ApiPropertyOptional({
    description: 'Data de cancelamento da assinatura',
    example: '2025-07-17T12:00:00Z',
  })
  @IsOptional()
  @IsDateString(
    {},
    {
      message: 'Data de cancelamento deve ser uma data válida',
    },
  )
  canceledAt?: string;

  @ApiPropertyOptional({
    description: 'Metadados atualizados da assinatura',
    example: { updated_reason: 'plan_upgrade', previous_plan: 'basic' },
  })
  @IsOptional()
  @IsObject({
    message: 'Metadados deve ser um objeto',
  })
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Motivo da atualização',
    example: 'Upgrade de plano solicitado pelo usuário',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({
    message: 'Motivo deve ser uma string',
  })
  @Transform(({ value }) => value?.trim())
  updateReason?: string;
}
