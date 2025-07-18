import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsOptional,
  Length,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para verificação de email
 */
export class VerifyEmailDto {
  @ApiProperty({
    description: 'Token de verificação recebido por email',
    example: 'abc123def456ghi789',
  })
  @IsString({ message: 'Token deve ser uma string' })
  @IsNotEmpty({ message: 'Token é obrigatório' })
  @Length(6, 256, {
    message: 'Token deve ter entre 6 e 256 caracteres',
  })
  token: string;

  @ApiPropertyOptional({
    description: 'Email do usuário (opcional para validação adicional)',
    example: 'usuario@exemplo.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email deve ter formato válido' })
  email?: string;
}

/**
 * DTO para reenvio de email de verificação
 */
export class ResendVerificationDto {
  @ApiProperty({
    description: 'Email do usuário para reenvio da verificação',
    example: 'usuario@exemplo.com',
  })
  @IsEmail({}, { message: 'Email deve ter formato válido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;
}

/**
 * DTO para solicitação de recuperação de senha
 */
export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email do usuário para recuperação de senha',
    example: 'usuario@exemplo.com',
  })
  @IsEmail({}, { message: 'Email deve ter formato válido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @ApiPropertyOptional({
    description: 'URL de callback opcional para redirecionamento após reset',
    example: 'https://app.neuralcontent.com/reset-password',
  })
  @IsOptional()
  @IsString({ message: 'Callback URL deve ser uma string' })
  @Matches(/^https?:\/\/.+/, {
    message: 'Callback URL deve ser uma URL válida',
  })
  callbackUrl?: string;
}

/**
 * DTO para reset de senha
 */
export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token de reset de senha recebido por email',
    example: 'reset_abc123def456ghi789',
  })
  @IsString({ message: 'Token deve ser uma string' })
  @IsNotEmpty({ message: 'Token é obrigatório' })
  @Length(6, 256, {
    message: 'Token deve ter entre 6 e 256 caracteres',
  })
  token: string;

  @ApiProperty({
    description: 'Nova senha do usuário',
    example: 'MinhaNovaSenh@123',
  })
  @IsString({ message: 'Nova senha deve ser uma string' })
  @IsNotEmpty({ message: 'Nova senha é obrigatória' })
  @Length(8, 128, {
    message: 'Nova senha deve ter entre 8 e 128 caracteres',
  })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message:
        'Nova senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial',
    },
  )
  newPassword: string;

  @ApiProperty({
    description: 'Confirmação da nova senha',
    example: 'MinhaNovaSenh@123',
  })
  @IsString({ message: 'Confirmação de senha deve ser uma string' })
  @IsNotEmpty({ message: 'Confirmação de senha é obrigatória' })
  confirmPassword: string;

  @ApiPropertyOptional({
    description: 'Email do usuário (opcional para validação adicional)',
    example: 'usuario@exemplo.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email deve ter formato válido' })
  email?: string;
}

/**
 * DTO de resposta para verificação de email
 */
export class VerifyEmailResponseDto {
  @ApiProperty({
    description: 'Status da verificação',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Mensagem de resposta',
    example: 'Email verificado com sucesso',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'Dados do usuário verificado',
  })
  user?: {
    id: number;
    email: string;
    name: string;
    emailVerified: boolean;
  };
}

/**
 * DTO de resposta para operações de email
 */
export class EmailOperationResponseDto {
  @ApiProperty({
    description: 'Status da operação',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Mensagem de resposta',
    example: 'Email enviado com sucesso',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'Tempo de expiração do token (em minutos)',
    example: 60,
  })
  expiresInMinutes?: number;
}
