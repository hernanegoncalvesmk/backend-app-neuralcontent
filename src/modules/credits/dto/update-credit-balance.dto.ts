import { PartialType } from '@nestjs/swagger';
import { CreateCreditBalanceDto } from './create-credit-balance.dto';
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para atualização de saldo de créditos
 *
 * @description Valida dados para atualização de saldos de créditos existentes.
 * Herda todas as propriedades de CreateCreditBalanceDto como opcionais.
 * @author NeuralContent Team
 * @since 1.0.0
 */
export class UpdateCreditBalanceDto extends PartialType(
  CreateCreditBalanceDto,
) {
  @ApiPropertyOptional({
    description: 'ID do saldo de créditos (readonly para identificação)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    readOnly: true,
  })
  @IsOptional()
  @IsString()
  readonly id?: string;
}
