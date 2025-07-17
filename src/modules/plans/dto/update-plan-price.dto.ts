import { PartialType } from '@nestjs/swagger';
import { CreatePlanPriceDto } from './create-plan-price.dto';
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para atualização de preço de plano
 *
 * @description Valida dados para atualização de preços de planos existentes.
 * Herda todas as propriedades de CreatePlanPriceDto como opcionais.
 * @author NeuralContent Team
 * @since 1.0.0
 */
export class UpdatePlanPriceDto extends PartialType(CreatePlanPriceDto) {
  @ApiPropertyOptional({
    description: 'ID do preço do plano (readonly para identificação)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    readOnly: true,
  })
  @IsOptional()
  @IsString()
  readonly id?: string;
}
