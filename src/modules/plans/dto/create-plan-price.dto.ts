import { IsNotEmpty, IsString, IsEnum, IsNumber, Min, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { BillingPeriod, Currency } from '../entities/plan-price.entity';

/**
 * DTO para criação de preço de plano
 * 
 * @description Valida dados para criação de novos preços de planos
 * @author NeuralContent Team
 * @since 1.0.0
 */
export class CreatePlanPriceDto {
  @ApiProperty({
    description: 'ID do plano ao qual o preço será associado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString({
    message: 'ID do plano deve ser uma string',
  })
  @IsNotEmpty({
    message: 'ID do plano é obrigatório',
  })
  planId: string;

  @ApiProperty({
    description: 'Moeda do preço',
    enum: Currency,
    example: Currency.BRL,
  })
  @IsEnum(Currency, {
    message: 'Moeda deve ser uma das opções válidas: BRL, USD, EUR',
  })
  currency: Currency;

  @ApiProperty({
    description: 'Valor do preço em formato decimal',
    example: 29.99,
    minimum: 0,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message: 'Valor deve ser um número com no máximo 2 casas decimais',
    }
  )
  @Min(0, {
    message: 'Valor deve ser maior ou igual a zero',
  })
  @Transform(({ value }) => parseFloat(value))
  amount: number;

  @ApiProperty({
    description: 'Tipo de período de cobrança',
    enum: BillingPeriod,
    example: BillingPeriod.MONTHLY,
  })
  @IsEnum(BillingPeriod, {
    message: 'Período de cobrança deve ser: month ou year',
  })
  intervalType: BillingPeriod;

  @ApiPropertyOptional({
    description: 'Código de desconto aplicável',
    example: 'PROMO2025',
    maxLength: 50,
  })
  @IsOptional()
  @IsString({
    message: 'Código de desconto deve ser uma string',
  })
  @Transform(({ value }) => value?.trim().toUpperCase())
  discountCode?: string;

  @ApiPropertyOptional({
    description: 'Percentual de desconto (0-100)',
    example: 15.5,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message: 'Percentual de desconto deve ser um número com no máximo 2 casas decimais',
    }
  )
  @Min(0, {
    message: 'Percentual de desconto deve ser maior ou igual a zero',
  })
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  discountPercent?: number;

  @ApiPropertyOptional({
    description: 'Status se o preço está ativo',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({
    message: 'Status ativo deve ser true ou false',
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return value;
  })
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Preço está disponível para assinatura',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({
    message: 'Disponível deve ser true ou false',
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return value;
  })
  isAvailable?: boolean;

  @ApiPropertyOptional({
    description: 'Ordem de exibição do preço',
    example: 1,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, {
    message: 'Ordem de exibição deve ser um número',
  })
  @Min(0, {
    message: 'Ordem de exibição deve ser maior ou igual a zero',
  })
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  displayOrder?: number;

  @ApiPropertyOptional({
    description: 'Observações sobre o preço',
    example: 'Preço promocional válido até dezembro/2025',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({
    message: 'Observações devem ser uma string',
  })
  @Transform(({ value }) => value?.trim())
  notes?: string;
}
