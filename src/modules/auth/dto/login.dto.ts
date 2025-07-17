import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * DTO para login de usuário
 *
 * @description Valida os dados de entrada para autenticação de usuário
 * @author NeuralContent Team
 * @since 1.0.0
 */
export class LoginDto {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'usuario@neuralcontent.com',
    format: 'email',
  })
  @IsEmail(
    {},
    {
      message: 'Email deve ter um formato válido',
    },
  )
  @IsNotEmpty({
    message: 'Email é obrigatório',
  })
  @Transform(({ value }) => value?.toLowerCase()?.trim())
  email: string;

  @ApiProperty({
    description: 'Senha do usuário',
    example: 'MinhaS3nh@Segura',
    minLength: 6,
    maxLength: 50,
  })
  @IsString({
    message: 'Senha deve ser uma string',
  })
  @IsNotEmpty({
    message: 'Senha é obrigatória',
  })
  @MinLength(6, {
    message: 'Senha deve ter pelo menos 6 caracteres',
  })
  @MaxLength(50, {
    message: 'Senha deve ter no máximo 50 caracteres',
  })
  password: string;

  @ApiPropertyOptional({
    description: 'Manter sessão ativa por mais tempo',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({
    message: 'Remember me deve ser um valor booleano',
  })
  @Transform(({ value }) => value === 'true' || value === true)
  rememberMe?: boolean = false;
}
