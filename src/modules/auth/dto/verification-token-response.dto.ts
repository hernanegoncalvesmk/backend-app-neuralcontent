import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Exclude } from 'class-transformer';
import { VerificationTokenType } from '../entities/verification-token.entity';

/**
 * DTO de resposta para token de verificação
 *
 * @description Formata dados de token de verificação para resposta da API
 * @author NeuralContent Team
 * @since 1.0.0
 */
export class VerificationTokenResponseDto {
  @ApiProperty({
    description: 'ID único do token de verificação',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'ID do usuário proprietário do token',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  userId: string;

  @ApiProperty({
    description:
      'Token de verificação único (parcialmente oculto por segurança)',
    example: 'unique-hash-***',
  })
  @Expose()
  @Transform(({ value }) => {
    // Por segurança, mostra apenas os primeiros e últimos caracteres
    if (!value || value.length < 8) return '***';
    return `${value.substring(0, 8)}***${value.substring(value.length - 4)}`;
  })
  token: string;

  @ApiProperty({
    description: 'Tipo do token de verificação',
    enum: VerificationTokenType,
    example: VerificationTokenType.EMAIL_VERIFICATION,
  })
  @Expose()
  type: VerificationTokenType;

  @ApiProperty({
    description: 'Data e hora de expiração do token',
    example: '2025-01-14T12:00:00Z',
  })
  @Expose()
  @Transform(({ value }) =>
    value instanceof Date ? value.toISOString() : value,
  )
  expiresAt: Date;

  @ApiProperty({
    description: 'Dados adicionais em formato JSON',
    example: '{"email": "user@example.com", "attempts": 0}',
    required: false,
  })
  @Expose()
  data?: string;

  @ApiProperty({
    description: 'Data e hora quando o token foi usado',
    example: '2025-01-13T15:30:00Z',
    required: false,
  })
  @Expose()
  @Transform(({ value }) =>
    value instanceof Date ? value.toISOString() : value,
  )
  usedAt?: Date;

  @ApiProperty({
    description: 'Data de criação do token',
    example: '2025-01-13T12:00:00Z',
  })
  @Expose()
  @Transform(({ value }) =>
    value instanceof Date ? value.toISOString() : value,
  )
  createdAt: Date;

  @ApiProperty({
    description: 'Status do token (valid, expired, used)',
    example: 'valid',
  })
  @Expose()
  @Transform(({ obj }) => {
    if (obj.usedAt) return 'used';

    const now = new Date();
    const expirationDate = new Date(obj.expiresAt);

    if (expirationDate < now) return 'expired';
    return 'valid';
  })
  status: string;

  @ApiProperty({
    description: 'Tempo restante até expiração em minutos',
    example: 1425,
    required: false,
  })
  @Expose()
  @Transform(({ obj }) => {
    if (obj.usedAt) return 0;

    const now = new Date();
    const expirationDate = new Date(obj.expiresAt);

    if (expirationDate < now) return 0;

    const diffTime = expirationDate.getTime() - now.getTime();
    return Math.floor(diffTime / (1000 * 60)); // em minutos
  })
  minutesUntilExpiration?: number;

  @ApiProperty({
    description: 'Texto amigável do tipo de token',
    example: 'Verificação de Email',
  })
  @Expose()
  @Transform(({ obj }) => {
    const typeMap: Record<VerificationTokenType, string> = {
      [VerificationTokenType.EMAIL_VERIFICATION]: 'Verificação de Email',
      [VerificationTokenType.PASSWORD_RESET]: 'Reset de Senha',
      [VerificationTokenType.PHONE_VERIFICATION]: 'Verificação de Telefone',
    };
    return typeMap[obj.type as VerificationTokenType] || obj.type;
  })
  typeLabel: string;

  @ApiProperty({
    description: 'Indica se o token ainda pode ser usado',
    example: true,
  })
  @Expose()
  @Transform(({ obj }) => {
    if (obj.usedAt) return false;

    const now = new Date();
    const expirationDate = new Date(obj.expiresAt);

    return expirationDate > now;
  })
  isValid: boolean;

  // Campos sensíveis que não devem aparecer na resposta
  @Exclude()
  ipAddress?: string;

  @Exclude()
  userAgent?: string;
}
