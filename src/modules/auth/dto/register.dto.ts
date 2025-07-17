import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * Enum para tipos de usuário
 */
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}

/**
 * DTO para registro de novo usuário
 *
 * @description Valida os dados de entrada para criação de nova conta
 * @author NeuralContent Team
 * @since 1.0.0
 */
export class RegisterDto {
  @ApiProperty({
    description: 'Primeiro nome do usuário',
    example: 'João',
    minLength: 2,
    maxLength: 100,
  })
  @IsString({
    message: 'Primeiro nome deve ser uma string',
  })
  @IsNotEmpty({
    message: 'Primeiro nome é obrigatório',
  })
  @MinLength(2, {
    message: 'Primeiro nome deve ter pelo menos 2 caracteres',
  })
  @MaxLength(100, {
    message: 'Primeiro nome deve ter no máximo 100 caracteres',
  })
  @Matches(/^[a-zA-ZÀ-ÿ\s]+$/, {
    message: 'Primeiro nome deve conter apenas letras e espaços',
  })
  @Transform(({ value }) => value?.trim())
  firstName: string;

  @ApiProperty({
    description: 'Sobrenome do usuário',
    example: 'Silva Santos',
    minLength: 2,
    maxLength: 100,
  })
  @IsString({
    message: 'Sobrenome deve ser uma string',
  })
  @IsNotEmpty({
    message: 'Sobrenome é obrigatório',
  })
  @MinLength(2, {
    message: 'Sobrenome deve ter pelo menos 2 caracteres',
  })
  @MaxLength(100, {
    message: 'Sobrenome deve ter no máximo 100 caracteres',
  })
  @Matches(/^[a-zA-ZÀ-ÿ\s]+$/, {
    message: 'Sobrenome deve conter apenas letras e espaços',
  })
  @Transform(({ value }) => value?.trim())
  lastName: string;

  @ApiProperty({
    description: 'Email único do usuário',
    example: 'joao.silva@neuralcontent.com',
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
  @MaxLength(255, {
    message: 'Email deve ter no máximo 255 caracteres',
  })
  @Transform(({ value }) => value?.toLowerCase()?.trim())
  email: string;

  @ApiProperty({
    description: 'Senha segura do usuário',
    example: 'MinhaS3nh@SuperSegura123',
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
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial',
  })
  password: string;

  @ApiPropertyOptional({
    description: 'Papel do usuário no sistema',
    example: UserRole.USER,
    enum: UserRole,
    default: UserRole.USER,
  })
  @IsOptional()
  @IsEnum(UserRole, {
    message: 'Papel deve ser um dos valores válidos: user, admin, moderator',
  })
  role?: UserRole = UserRole.USER;

  @ApiPropertyOptional({
    description: 'Telefone do usuário (opcional)',
    example: '+5511999999999',
  })
  @IsOptional()
  @IsString({
    message: 'Telefone deve ser uma string',
  })
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Telefone deve estar em formato internacional válido',
  })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Aceitar termos de uso e política de privacidade',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean({
    message: 'Aceitar termos deve ser um valor booleano',
  })
  @Transform(({ value }) => value === 'true' || value === true)
  acceptTerms?: boolean = false;

  @ApiPropertyOptional({
    description: 'Aceitar receber comunicações de marketing',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({
    message: 'Aceitar marketing deve ser um valor booleano',
  })
  @Transform(({ value }) => value === 'true' || value === true)
  acceptMarketing?: boolean = false;
}
