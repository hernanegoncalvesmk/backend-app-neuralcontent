import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsEnum,
  IsOptional,
  IsDateString,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { SubscriptionStatus } from '../entities/user-subscription.entity';

/**
 * DTO para criação de assinatura de usuário
 *
 * @description Valida dados para criação de nova assinatura
 * @author NeuralContent Team
 * @since 1.0.0
 */
export class CreateUserSubscriptionDto {
  @ApiProperty({
    description: 'ID do usuário',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({
    message: 'ID do usuário é obrigatório',
  })
  @IsString({
    message: 'ID do usuário deve ser uma string',
  })
  @IsUUID(4, {
    message: 'ID do usuário deve ser um UUID válido',
  })
  userId: string;

  @ApiProperty({
    description: 'ID do plano',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({
    message: 'ID do plano é obrigatório',
  })
  @IsString({
    message: 'ID do plano deve ser uma string',
  })
  @IsUUID(4, {
    message: 'ID do plano deve ser um UUID válido',
  })
  planId: string;

  @ApiPropertyOptional({
    description: 'ID da assinatura no Stripe',
    example: 'sub_1234567890abcdef',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({
    message: 'ID da assinatura Stripe deve ser uma string',
  })
  @Transform(({ value }) => value?.trim())
  stripeSubscriptionId?: string;

  @ApiPropertyOptional({
    description: 'ID do cliente no Stripe',
    example: 'cus_1234567890abcdef',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({
    message: 'ID do cliente Stripe deve ser uma string',
  })
  @Transform(({ value }) => value?.trim())
  stripeCustomerId?: string;

  @ApiProperty({
    description: 'Status inicial da assinatura',
    enum: SubscriptionStatus,
    example: SubscriptionStatus.ACTIVE,
  })
  @IsEnum(SubscriptionStatus, {
    message: 'Status deve ser um valor válido',
  })
  status: SubscriptionStatus;

  @ApiProperty({
    description: 'Data de início do período atual',
    example: '2025-07-17T00:00:00Z',
  })
  @IsNotEmpty({
    message: 'Data de início do período é obrigatória',
  })
  @IsDateString(
    {},
    {
      message: 'Data de início deve ser uma data válida',
    },
  )
  currentPeriodStart: string;

  @ApiProperty({
    description: 'Data de fim do período atual',
    example: '2025-08-17T00:00:00Z',
  })
  @IsNotEmpty({
    message: 'Data de fim do período é obrigatória',
  })
  @IsDateString(
    {},
    {
      message: 'Data de fim deve ser uma data válida',
    },
  )
  currentPeriodEnd: string;

  @ApiPropertyOptional({
    description: 'Data de início do trial',
    example: '2025-07-17T00:00:00Z',
  })
  @IsOptional()
  @IsDateString(
    {},
    {
      message: 'Data de início do trial deve ser uma data válida',
    },
  )
  trialStartDate?: string;

  @ApiPropertyOptional({
    description: 'Data de fim do trial',
    example: '2025-07-24T00:00:00Z',
  })
  @IsOptional()
  @IsDateString(
    {},
    {
      message: 'Data de fim do trial deve ser uma data válida',
    },
  )
  trialEndDate?: string;

  @ApiPropertyOptional({
    description: 'Se o trial foi usado',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({
    message: 'Trial usado deve ser verdadeiro ou falso',
  })
  @Transform(({ value }) => value === 'true' || value === true)
  isTrialUsed?: boolean = false;

  @ApiPropertyOptional({
    description: 'Créditos concedidos na assinatura',
    example: 1000,
    minimum: 0,
    maximum: 1000000,
    default: 0,
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
  creditsGranted?: number = 0;

  @ApiPropertyOptional({
    description: 'Créditos já utilizados',
    example: 0,
    minimum: 0,
    default: 0,
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
  creditsUsed?: number = 0;

  @ApiPropertyOptional({
    description: 'Metadados adicionais da assinatura',
    example: { source: 'api', campaign: 'summer2025' },
  })
  @IsOptional()
  @IsObject({
    message: 'Metadados deve ser um objeto',
  })
  metadata?: Record<string, any>;
}
