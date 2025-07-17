import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { VerificationTokenType } from '../entities/verification-token.entity';

/**
 * DTO para invalidação de tokens de verificação
 *
 * @description Valida dados para invalidação de tokens de verificação específicos ou por tipo
 * @author NeuralContent Team
 * @since 1.0.0
 */
export class InvalidateTokensDto {
  @ApiProperty({
    description: 'ID do usuário proprietário dos tokens',
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

  @ApiPropertyOptional({
    description: 'Tipo específico de token para invalidar',
    enum: VerificationTokenType,
    example: VerificationTokenType.EMAIL_VERIFICATION,
  })
  @IsOptional()
  @IsEnum(VerificationTokenType, {
    message: 'Tipo de token deve ser um valor válido',
  })
  type?: VerificationTokenType;

  @ApiPropertyOptional({
    description: 'IDs específicos de tokens para invalidar',
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    isArray: true,
  })
  @IsOptional()
  @IsArray({
    message: 'IDs de tokens deve ser um array',
  })
  @IsUUID(4, {
    each: true,
    message: 'Cada ID de token deve ser um UUID válido',
  })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  tokenIds?: string[];

  @ApiPropertyOptional({
    description: 'Motivo da invalidação',
    example: 'Usuario solicitou nova verificacao',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({
    message: 'Motivo deve ser uma string',
  })
  @Transform(({ value }) => value?.trim())
  reason?: string;

  @ApiPropertyOptional({
    description: 'Se deve invalidar todos os tokens do usuário',
    example: false,
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  invalidateAll?: boolean = false;
}

/**
 * DTO de resposta para invalidação de tokens
 *
 * @description Retorna informações sobre a operação de invalidação
 * @author NeuralContent Team
 * @since 1.0.0
 */
export class InvalidateTokensResponseDto {
  @ApiProperty({
    description: 'Se a operação foi bem-sucedida',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Quantidade de tokens invalidados',
    example: 3,
  })
  tokensInvalidated: number;

  @ApiProperty({
    description: 'Tipos de tokens invalidados',
    example: ['email_verification', 'password_reset'],
    isArray: true,
  })
  typesInvalidated: string[];

  @ApiProperty({
    description: 'Mensagem de resultado da operação',
    example: 'Tokens invalidados com sucesso',
  })
  message: string;

  @ApiProperty({
    description: 'Timestamp da operação',
    example: '2025-07-17T12:00:00Z',
  })
  timestamp: Date;
}
