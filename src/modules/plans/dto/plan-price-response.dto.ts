import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { BillingPeriod, Currency } from '../entities/plan-price.entity';

/**
 * DTO de resposta para preço de plano
 * 
 * @description Formata dados de preço de plano para resposta da API
 * @author NeuralContent Team
 * @since 1.0.0
 */
export class PlanPriceResponseDto {
  @ApiProperty({
    description: 'ID único do preço do plano',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'ID do plano',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  planId: string;

  @ApiProperty({
    description: 'Moeda do preço',
    enum: Currency,
    example: Currency.BRL,
  })
  @Expose()
  currency: Currency;

  @ApiProperty({
    description: 'Valor do preço em formato decimal',
    example: 29.99,
  })
  @Expose()
  @Transform(({ value }) => parseFloat(value))
  amount: number;

  @ApiProperty({
    description: 'Tipo de período de cobrança',
    enum: BillingPeriod,
    example: BillingPeriod.MONTHLY,
  })
  @Expose()
  intervalType: BillingPeriod;

  @ApiProperty({
    description: 'Código de desconto aplicável',
    example: 'PROMO2025',
    required: false,
  })
  @Expose()
  discountCode?: string;

  @ApiProperty({
    description: 'Percentual de desconto (0-100)',
    example: 15.5,
    required: false,
  })
  @Expose()
  @Transform(({ value }) => value ? parseFloat(value) : null)
  discountPercent?: number;

  @ApiProperty({
    description: 'Status se o preço está ativo',
    example: true,
  })
  @Expose()
  isActive: boolean;

  @ApiProperty({
    description: 'Preço está disponível para assinatura',
    example: true,
  })
  @Expose()
  isAvailable: boolean;

  @ApiProperty({
    description: 'Ordem de exibição do preço',
    example: 1,
    required: false,
  })
  @Expose()
  @Transform(({ value }) => value ? parseInt(value) : null)
  displayOrder?: number;

  @ApiProperty({
    description: 'Observações sobre o preço',
    example: 'Preço promocional válido até dezembro/2025',
    required: false,
  })
  @Expose()
  notes?: string;

  @ApiProperty({
    description: 'Data de criação do registro',
    example: '2025-01-13T12:00:00Z',
  })
  @Expose()
  @Transform(({ value }) => value instanceof Date ? value.toISOString() : value)
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2025-01-13T12:00:00Z',
  })
  @Expose()
  @Transform(({ value }) => value instanceof Date ? value.toISOString() : value)
  updatedAt: Date;

  @ApiProperty({
    description: 'Valor com desconto aplicado (calculado)',
    example: 25.49,
    required: false,
  })
  @Expose()
  @Transform(({ obj }) => {
    if (obj.discountPercent && obj.discountPercent > 0) {
      const discount = parseFloat(obj.amount) * (parseFloat(obj.discountPercent) / 100);
      return parseFloat((parseFloat(obj.amount) - discount).toFixed(2));
    }
    return parseFloat(obj.amount);
  })
  finalAmount?: number;

  @ApiProperty({
    description: 'Texto formatado do período de cobrança',
    example: 'Mensal',
  })
  @Expose()
  @Transform(({ obj }) => {
    const periodMap: Record<BillingPeriod, string> = {
      [BillingPeriod.MONTHLY]: 'Mensal',
      [BillingPeriod.YEARLY]: 'Anual',
    };
    return periodMap[obj.intervalType as BillingPeriod] || obj.intervalType;
  })
  intervalTypeLabel?: string;

  @ApiProperty({
    description: 'Símbolo da moeda formatado',
    example: 'R$',
  })
  @Expose()
  @Transform(({ obj }) => {
    const currencyMap: Record<Currency, string> = {
      [Currency.BRL]: 'R$',
      [Currency.USD]: '$',
      [Currency.EUR]: '€',
    };
    return currencyMap[obj.currency as Currency] || obj.currency;
  })
  currencySymbol?: string;
}
