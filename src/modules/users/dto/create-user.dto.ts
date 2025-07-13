import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, IsOptional, IsEnum, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * Tipos de role disponíveis para usuários
 */
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  SUPER_ADMIN = 'super_admin',
}

/**
 * Status disponíveis para usuários
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
}

/**
 * DTO para criação de usuário
 * 
 * @description Valida dados para criação de novos usuários
 * @author NeuralContent Team
 * @since 1.0.0
 */
export class CreateUserDto {
  @ApiProperty({
    description: 'Email único do usuário',
    example: 'usuario@neuralcontent.com',
    format: 'email',
  })
  @IsEmail(
    {},
    {
      message: 'Email deve ter um formato válido',
    }
  )
  @IsNotEmpty({
    message: 'Email é obrigatório',
  })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'João Silva Santos',
    minLength: 2,
    maxLength: 100,
  })
  @IsString({
    message: 'Nome deve ser uma string',
  })
  @IsNotEmpty({
    message: 'Nome é obrigatório',
  })
  @MinLength(2, {
    message: 'Nome deve ter pelo menos 2 caracteres',
  })
  @MaxLength(100, {
    message: 'Nome deve ter no máximo 100 caracteres',
  })
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiProperty({
    description: 'Senha do usuário',
    example: 'MinhaSenh@123!',
    minLength: 8,
    maxLength: 50,
  })
  @IsString({
    message: 'Senha deve ser uma string',
  })
  @IsNotEmpty({
    message: 'Senha é obrigatória',
  })
  @MinLength(8, {
    message: 'Senha deve ter pelo menos 8 caracteres',
  })
  @MaxLength(50, {
    message: 'Senha deve ter no máximo 50 caracteres',
  })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message: 'Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial',
    }
  )
  password: string;

  @ApiPropertyOptional({
    description: 'Papel do usuário no sistema',
    enum: UserRole,
    default: UserRole.USER,
  })
  @IsOptional()
  @IsEnum(UserRole, {
    message: 'Role deve ser: user, admin ou moderator',
  })
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Status inicial do usuário',
    enum: UserStatus,
    default: UserStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(UserStatus, {
    message: 'Status deve ser: active, inactive, pending ou suspended',
  })
  status?: UserStatus;
}
