import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { PlanType } from '../entities/plan.entity';

export class CreatePlanDto {
  @ApiProperty({
    description: 'Nome do plano',
    example: 'Premium',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  name: string;

  @ApiProperty({
    description: 'Slug único do plano para URLs',
    example: 'premium-plan',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @MinLength(2, { message: 'Slug deve ter pelo menos 2 caracteres' })
  @MaxLength(50, { message: 'Slug deve ter no máximo 50 caracteres' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  slug: string;

  @ApiPropertyOptional({
    description: 'Descrição detalhada do plano',
    example: 'Plano premium com recursos avançados e suporte prioritário',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Descrição deve ter no máximo 2000 caracteres' })
  description?: string;

  @ApiProperty({
    description: 'Tipo do plano',
    enum: PlanType,
    example: PlanType.PREMIUM,
  })
  @IsEnum(PlanType, { message: 'Tipo do plano deve ser um valor válido' })
  type: PlanType;

  @ApiPropertyOptional({
    description: 'Preço mensal em centavos',
    example: 2999,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Preço mensal deve ser um número' })
  @Min(0, { message: 'Preço mensal deve ser maior ou igual a zero' })
  @Transform(({ value }) => Number(value))
  monthlyPrice?: number;

  @ApiPropertyOptional({
    description: 'Preço anual em centavos',
    example: 29990,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Preço anual deve ser um número' })
  @Min(0, { message: 'Preço anual deve ser maior ou igual a zero' })
  @Transform(({ value }) => Number(value))
  annualPrice?: number;

  @ApiPropertyOptional({
    description: 'Créditos mensais inclusos no plano',
    example: 1000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Créditos mensais deve ser um número' })
  @Min(0, { message: 'Créditos mensais deve ser maior ou igual a zero' })
  @Transform(({ value }) => Number(value))
  monthlyCredits?: number;

  @ApiPropertyOptional({
    description: 'Se o plano está ativo e disponível',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'Status ativo deve ser verdadeiro ou falso' })
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Se o plano é destacado na lista',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Status destacado deve ser verdadeiro ou falso' })
  @Transform(({ value }) => value === 'true' || value === true)
  isFeatured?: boolean;

  @ApiPropertyOptional({
    description: 'Ordem de exibição do plano',
    example: 1,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Ordem deve ser um número' })
  @Min(0, { message: 'Ordem deve ser maior ou igual a zero' })
  @Transform(({ value }) => Number(value))
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'Metadados adicionais do plano',
    example: { color: '#007bff', icon: 'star' },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
