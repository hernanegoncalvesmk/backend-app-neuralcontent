import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Min,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * DTO para criação de saldo de créditos
 *
 * @description Valida dados para criação de novos saldos de créditos
 * @author NeuralContent Team
 * @since 1.0.0
 */
export class CreateCreditBalanceDto {
  @ApiProperty({
    description: 'ID único do usuário',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString({
    message: 'ID do usuário deve ser uma string',
  })
  @IsNotEmpty({
    message: 'ID do usuário é obrigatório',
  })
  userId: string;

  @ApiProperty({
    description: 'Créditos mensais disponíveis no ciclo atual',
    example: 1000,
    minimum: 0,
  })
  @IsNumber(
    {},
    {
      message: 'Créditos mensais deve ser um número',
    },
  )
  @Min(0, {
    message: 'Créditos mensais deve ser maior ou igual a zero',
  })
  @Transform(({ value }) => parseInt(value))
  monthlyCredits: number;

  @ApiPropertyOptional({
    description: 'Créditos mensais já utilizados no ciclo atual',
    example: 250,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber(
    {},
    {
      message: 'Créditos utilizados deve ser um número',
    },
  )
  @Min(0, {
    message: 'Créditos utilizados deve ser maior ou igual a zero',
  })
  @Transform(({ value }) => (value ? parseInt(value) : 0))
  monthlyUsed?: number;

  @ApiProperty({
    description: 'Data do próximo reset mensal de créditos',
    example: '2025-08-13T12:00:00Z',
  })
  @IsDateString(
    {},
    {
      message: 'Data de reset deve ser uma data válida no formato ISO',
    },
  )
  monthlyResetAt: string;

  @ApiPropertyOptional({
    description: 'Créditos extras acumulados (não resetam mensalmente)',
    example: 500,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber(
    {},
    {
      message: 'Créditos extras deve ser um número',
    },
  )
  @Min(0, {
    message: 'Créditos extras deve ser maior ou igual a zero',
  })
  @Transform(({ value }) => (value ? parseInt(value) : 0))
  extraCredits?: number;

  @ApiPropertyOptional({
    description: 'Créditos extras já utilizados',
    example: 50,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber(
    {},
    {
      message: 'Créditos extras utilizados deve ser um número',
    },
  )
  @Min(0, {
    message: 'Créditos extras utilizados deve ser maior ou igual a zero',
  })
  @Transform(({ value }) => (value ? parseInt(value) : 0))
  extraUsed?: number;

  @ApiPropertyOptional({
    description: 'Total de créditos já consumidos historicamente',
    example: 5000,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber(
    {},
    {
      message: 'Total consumido deve ser um número',
    },
  )
  @Min(0, {
    message: 'Total consumido deve ser maior ou igual a zero',
  })
  @Transform(({ value }) => (value ? parseInt(value) : 0))
  totalConsumed?: number;

  @ApiPropertyOptional({
    description: 'Data da última sincronização com transações',
    example: '2025-01-13T12:00:00Z',
  })
  @IsOptional()
  @IsDateString(
    {},
    {
      message:
        'Data da última sincronização deve ser uma data válida no formato ISO',
    },
  )
  lastSyncAt?: string;
}
