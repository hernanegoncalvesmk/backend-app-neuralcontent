import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { PlanType } from '../entities/plan.entity';

export class PlanFeatureResponseDto {
  @ApiProperty({
    description: 'ID da funcionalidade',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Chave da funcionalidade',
    example: 'unlimited_translations',
  })
  @Expose()
  featureKey: string;

  @ApiProperty({
    description: 'Nome da funcionalidade',
    example: 'Traduções Ilimitadas',
  })
  @Expose()
  name: string;

  @ApiPropertyOptional({
    description: 'Descrição da funcionalidade',
    example: 'Traduza documentos sem limites mensais',
  })
  @Expose()
  description?: string;

  @ApiPropertyOptional({
    description: 'Valor limite da funcionalidade',
    example: 100,
  })
  @Expose()
  limitValue?: number;

  @ApiPropertyOptional({
    description: 'Unidade do limite',
    example: 'translations',
  })
  @Expose()
  limitUnit?: string;

  @ApiProperty({
    description: 'Se a funcionalidade está habilitada',
    example: true,
  })
  @Expose()
  isEnabled: boolean;

  @ApiProperty({
    description: 'Ordem de exibição',
    example: 1,
  })
  @Expose()
  sortOrder: number;

  @ApiPropertyOptional({
    description: 'Metadados da funcionalidade',
    example: { icon: 'translate', color: '#28a745' },
  })
  @Expose()
  metadata?: Record<string, any>;
}

export class PlanResponseDto {
  @ApiProperty({
    description: 'ID único do plano',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Nome do plano',
    example: 'Premium',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Slug do plano',
    example: 'premium-plan',
  })
  @Expose()
  slug: string;

  @ApiPropertyOptional({
    description: 'Descrição do plano',
    example: 'Plano premium com recursos avançados',
  })
  @Expose()
  description?: string;

  @ApiProperty({
    description: 'Tipo do plano',
    enum: PlanType,
    example: PlanType.PREMIUM,
  })
  @Expose()
  type: PlanType;

  @ApiProperty({
    description: 'Preço mensal formatado em reais',
    example: 'R$ 29,99',
  })
  @Expose()
  @Transform(({ obj }) => {
    const price = obj.monthlyPrice || 0;
    return price === 0
      ? 'Gratuito'
      : `R$ ${(price / 100).toFixed(2).replace('.', ',')}`;
  })
  monthlyPriceFormatted: string;

  @ApiProperty({
    description: 'Preço anual formatado em reais',
    example: 'R$ 299,90',
  })
  @Expose()
  @Transform(({ obj }) => {
    const price = obj.annualPrice || 0;
    return price === 0
      ? 'Gratuito'
      : `R$ ${(price / 100).toFixed(2).replace('.', ',')}`;
  })
  annualPriceFormatted: string;

  @ApiProperty({
    description: 'Preço mensal em centavos',
    example: 2999,
  })
  @Expose()
  monthlyPrice: number;

  @ApiProperty({
    description: 'Preço anual em centavos',
    example: 29990,
  })
  @Expose()
  annualPrice: number;

  @ApiProperty({
    description: 'Desconto anual em porcentagem',
    example: 16.7,
  })
  @Expose()
  @Transform(({ obj }) => {
    const monthly = obj.monthlyPrice || 0;
    const annual = obj.annualPrice || 0;
    if (monthly === 0 || annual === 0) return 0;
    const monthlyTotal = monthly * 12;
    const discount = ((monthlyTotal - annual) / monthlyTotal) * 100;
    return Math.round(discount * 10) / 10;
  })
  annualDiscountPercentage: number;

  @ApiProperty({
    description: 'Créditos mensais inclusos',
    example: 1000,
  })
  @Expose()
  monthlyCredits: number;

  @ApiProperty({
    description: 'Se o plano está ativo',
    example: true,
  })
  @Expose()
  isActive: boolean;

  @ApiProperty({
    description: 'Se o plano é destacado',
    example: false,
  })
  @Expose()
  isFeatured: boolean;

  @ApiProperty({
    description: 'Ordem de exibição',
    example: 1,
  })
  @Expose()
  sortOrder: number;

  @ApiPropertyOptional({
    description: 'Metadados do plano',
    example: { color: '#007bff', icon: 'star' },
  })
  @Expose()
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Funcionalidades do plano',
    type: [PlanFeatureResponseDto],
  })
  @Expose()
  @Type(() => PlanFeatureResponseDto)
  features: PlanFeatureResponseDto[];

  @ApiProperty({
    description: 'Data de criação',
    example: '2025-07-13T12:00:00Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2025-07-13T12:00:00Z',
  })
  @Expose()
  updatedAt: Date;

  // Campos excluídos da resposta
  @Exclude()
  deletedAt?: Date;
}
