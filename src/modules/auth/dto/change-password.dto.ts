import {
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para alteração de senha de usuário autenticado
 *
 * @description Valida dados para mudança de senha por usuário logado
 * @author NeuralContent Team
 * @since 1.0.0
 */
export class ChangePasswordDto {
  @ApiProperty({
    description: 'Senha atual do usuário',
    example: 'MinhaS3nh@Atual123',
    minLength: 6,
    maxLength: 50,
  })
  @IsString({
    message: 'Senha atual deve ser uma string',
  })
  @IsNotEmpty({
    message: 'Senha atual é obrigatória',
  })
  @MinLength(6, {
    message: 'Senha atual deve ter pelo menos 6 caracteres',
  })
  @MaxLength(50, {
    message: 'Senha atual deve ter no máximo 50 caracteres',
  })
  currentPassword: string;

  @ApiProperty({
    description: 'Nova senha segura do usuário',
    example: 'MinhaS3nh@Nova456',
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
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Nova senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial',
  })
  newPassword: string;

  @ApiProperty({
    description: 'Confirmação da nova senha',
    example: 'MinhaS3nh@Nova456',
    minLength: 8,
    maxLength: 50,
  })
  @IsString({
    message: 'Confirmação de senha deve ser uma string',
  })
  @IsNotEmpty({
    message: 'Confirmação de senha é obrigatória',
  })
  @MinLength(8, {
    message: 'Confirmação de senha deve ter pelo menos 8 caracteres',
  })
  @MaxLength(50, {
    message: 'Confirmação de senha deve ter no máximo 50 caracteres',
  })
  confirmPassword: string;
}
