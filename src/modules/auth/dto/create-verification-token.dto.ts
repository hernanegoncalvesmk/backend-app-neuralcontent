import { IsNotEmpty, IsString, IsEnum, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { VerificationTokenType } from '../entities/verification-token.entity';

/**
 * DTO para criação de token de verificação
 * 
 * @description Valida dados para criação de novos tokens de verificação
 * @author NeuralContent Team
 * @since 1.0.0
 */
export class CreateVerificationTokenDto {
  @ApiProperty({
    description: 'ID do usuário proprietário do token',
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
    description: 'Token de verificação único (hash)',
    example: 'unique-hash-token-for-verification',
  })
  @IsString({
    message: 'Token deve ser uma string',
  })
  @IsNotEmpty({
    message: 'Token é obrigatório',
  })
  @Transform(({ value }) => value?.trim())
  token: string;

  @ApiProperty({
    description: 'Tipo do token de verificação',
    enum: VerificationTokenType,
    example: VerificationTokenType.EMAIL_VERIFICATION,
  })
  @IsEnum(VerificationTokenType, {
    message: 'Tipo do token deve ser: email_verification, password_reset ou phone_verification',
  })
  type: VerificationTokenType;

  @ApiProperty({
    description: 'Data e hora de expiração do token',
    example: '2025-01-14T12:00:00Z',
  })
  @IsDateString({}, {
    message: 'Data de expiração deve ser uma data válida no formato ISO',
  })
  expiresAt: string;

  @ApiPropertyOptional({
    description: 'Dados adicionais em formato JSON',
    example: '{"email": "user@example.com", "attempts": 0}',
  })
  @IsOptional()
  @IsString({
    message: 'Dados adicionais devem ser uma string JSON válida',
  })
  @Transform(({ value }) => value?.trim())
  data?: string;

  @ApiPropertyOptional({
    description: 'Endereço IP de onde o token foi gerado',
    example: '192.168.1.100',
  })
  @IsOptional()
  @IsString({
    message: 'IP deve ser uma string',
  })
  @Transform(({ value }) => value?.trim())
  ipAddress?: string;

  @ApiPropertyOptional({
    description: 'User-Agent do navegador/cliente',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  })
  @IsOptional()
  @IsString({
    message: 'User-Agent deve ser uma string',
  })
  @Transform(({ value }) => value?.trim())
  userAgent?: string;
}
