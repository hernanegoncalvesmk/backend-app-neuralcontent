import { PartialType, OmitType } from '@nestjs/mapped-types';
import { IsOptional, IsString, MinLength, MaxLength, IsEnum, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { CreateUserDto, UserRole, UserStatus } from './create-user.dto';

/**
 * DTO para atualização de usuário
 * 
 * @description Valida dados para atualização de usuários existentes
 * @author NeuralContent Team
 * @since 1.0.0
 */
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const)
) {
  @ApiPropertyOptional({
    description: 'Nome completo do usuário',
    example: 'João Silva Santos Atualizado',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString({
    message: 'Nome deve ser uma string',
  })
  @MinLength(2, {
    message: 'Nome deve ter pelo menos 2 caracteres',
  })
  @MaxLength(100, {
    message: 'Nome deve ter no máximo 100 caracteres',
  })
  @Transform(({ value }) => value?.trim())
  name?: string;

  @ApiPropertyOptional({
    description: 'Papel do usuário no sistema',
    enum: UserRole,
  })
  @IsOptional()
  @IsEnum(UserRole, {
    message: 'Role deve ser: user, admin ou moderator',
  })
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Status do usuário',
    enum: UserStatus,
  })
  @IsOptional()
  @IsEnum(UserStatus, {
    message: 'Status deve ser: active, inactive, pending ou suspended',
  })
  status?: UserStatus;

  @ApiPropertyOptional({
    description: 'Se o email foi verificado',
    example: true,
  })
  @IsOptional()
  @IsBoolean({
    message: 'isEmailVerified deve ser um boolean',
  })
  isEmailVerified?: boolean;
}

/**
 * DTO para mudança de senha
 * 
 * @description Valida dados para alteração de senha do usuário
 * @author NeuralContent Team
 * @since 1.0.0
 */
export class ChangePasswordDto {
  @ApiPropertyOptional({
    description: 'Senha atual do usuário (opcional para admin)',
    example: 'MinhaSenh@Atual123!',
  })
  @IsOptional()
  @IsString({
    message: 'Senha atual deve ser uma string',
  })
  currentPassword?: string;

  @ApiPropertyOptional({
    description: 'Nova senha do usuário',
    example: 'MinhaNov@Senha123!',
    minLength: 8,
    maxLength: 50,
  })
  @IsString({
    message: 'Nova senha deve ser uma string',
  })
  @MinLength(8, {
    message: 'Nova senha deve ter pelo menos 8 caracteres',
  })
  @MaxLength(50, {
    message: 'Nova senha deve ter no máximo 50 caracteres',
  })
  newPassword: string;
}
