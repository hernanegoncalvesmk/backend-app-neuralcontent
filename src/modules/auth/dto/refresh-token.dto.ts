import { IsNotEmpty, IsString, IsJWT, IsOptional, IsInt, Min, IsEmail, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * DTO para renovação de token de acesso
 * 
 * @description Valida o refresh token para geração de novo access token
 * @author NeuralContent Team
 * @since 1.0.0
 */
export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token válido para renovar acesso',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString({
    message: 'Refresh token deve ser uma string',
  })
  @IsNotEmpty({
    message: 'Refresh token é obrigatório',
  })
  @IsJWT({
    message: 'Refresh token deve ser um JWT válido',
  })
  refreshToken: string;
}

/**
 * DTO para resposta de autenticação bem-sucedida
 * 
 * @description Estrutura de retorno após login ou refresh token
 * @author NeuralContent Team
 * @since 1.0.0
 */
export class AuthResponseDto {
  @ApiProperty({
    description: 'Token de acesso JWT',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Token para renovação de acesso',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Tipo do token',
    example: 'Bearer',
    default: 'Bearer',
  })
  tokenType: string = 'Bearer';

  @ApiProperty({
    description: 'Tempo de expiração do access token em segundos',
    example: 900,
  })
  expiresIn: number;

  @ApiProperty({
    description: 'Timestamp de quando o token expira',
    example: 1625097600,
  })
  expiresAt: number;

  @ApiProperty({
    description: 'Dados básicos do usuário autenticado',
    example: {
      id: 1,
      email: 'usuario@neuralcontent.com',
      name: 'João Silva Santos',
      role: 'user',
      isEmailVerified: true
    }
  })
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
    isEmailVerified: boolean;
  };

  @ApiPropertyOptional({
    description: 'Permissões específicas do usuário',
    example: ['read_profile', 'write_content', 'manage_credits']
  })
  permissions?: string[];

  @ApiPropertyOptional({
    description: 'ID da sessão para controle',
    example: 'uuid-v4-generated'
  })
  sessionId?: string;
}

/**
 * DTO para logout do usuário
 * 
 * @description Valida dados para invalidação de sessão
 * @author NeuralContent Team
 * @since 1.0.0
 */
export class LogoutDto {
  @ApiProperty({
    description: 'Refresh token a ser invalidado',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString({
    message: 'Refresh token deve ser uma string',
  })
  @IsNotEmpty({
    message: 'Refresh token é obrigatório',
  })
  refreshToken: string;

  @ApiPropertyOptional({
    description: 'Logout de todos os dispositivos',
    example: false,
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  logoutAll?: boolean = false;
}

/**
 * DTO para validação de token
 * 
 * @description Valida se um token JWT está válido e ativo
 * @author NeuralContent Team
 * @since 1.0.0
 */
export class ValidateTokenDto {
  @ApiProperty({
    description: 'Token JWT a ser validado',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString({
    message: 'Token deve ser uma string',
  })
  @IsNotEmpty({
    message: 'Token é obrigatório',
  })
  @IsJWT({
    message: 'Token deve ser um JWT válido',
  })
  token: string;
}

/**
 * DTO para solicitação de redefinição de senha
 * 
 * @description Dados para iniciar processo de reset de senha
 * @author NeuralContent Team
 * @since 1.0.0
 */
export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email do usuário para redefinição',
    example: 'usuario@neuralcontent.com',
    format: 'email',
  })
  @IsEmail({}, {
    message: 'Email deve ter um formato válido',
  })
  @IsString({
    message: 'Email deve ser uma string',
  })
  @IsNotEmpty({
    message: 'Email é obrigatório',
  })
  @Transform(({ value }) => value?.toLowerCase()?.trim())
  email: string;
}

/**
 * DTO para redefinição de senha
 * 
 * @description Valida dados para nova senha com token de reset
 * @author NeuralContent Team
 * @since 1.0.0
 */
export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token de redefinição recebido por email',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString({
    message: 'Token deve ser uma string',
  })
  @IsNotEmpty({
    message: 'Token é obrigatório',
  })
  resetToken: string;

  @ApiProperty({
    description: 'Nova senha segura',
    example: 'MinhaS3nh@NovaSegura123',
    minLength: 8,
    maxLength: 50,
  })
  @IsString({
    message: 'Nova senha deve ser uma string',
  })
  @IsNotEmpty({
    message: 'Nova senha é obrigatória',
  })
  @MinLength(8, {
    message: 'Nova senha deve ter pelo menos 8 caracteres',
  })
  @MaxLength(50, {
    message: 'Nova senha deve ter no máximo 50 caracteres',
  })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
    {
      message: 'Nova senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial',
    }
  )
  newPassword: string;
}
