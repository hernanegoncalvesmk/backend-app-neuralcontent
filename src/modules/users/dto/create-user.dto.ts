import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, IsOptional, IsEnum, Matches, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * Tipos de role disponíveis para usuários - Alinhado com migration usr_users
 */
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin', 
  SUPER_ADMIN = 'super-admin',
  GUEST = 'guest',
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
  @Transform(({ value }) => value?.trim())
  lastName: string;

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
    description: 'Status se o usuário está ativo',
    default: true,
  })
  @IsOptional()
  @IsBoolean({
    message: 'isActive deve ser um valor booleano',
  })
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Telefone de contato do usuário',
    example: '+55 11 99999-9999',
    maxLength: 20,
  })
  @IsOptional()
  @IsString({
    message: 'Telefone deve ser uma string',
  })
  @MaxLength(20, {
    message: 'Telefone deve ter no máximo 20 caracteres',
  })
  @Transform(({ value }) => value?.trim())
  phone?: string;

  @ApiPropertyOptional({
    description: 'Biografia ou descrição do usuário',
    example: 'Desenvolvedor apaixonado por tecnologia e inovação.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({
    message: 'Bio deve ser uma string',
  })
  @MaxLength(500, {
    message: 'Bio deve ter no máximo 500 caracteres',
  })
  @Transform(({ value }) => value?.trim())
  bio?: string;

  @ApiPropertyOptional({
    description: 'Cidade do usuário',
    example: 'São Paulo',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({
    message: 'Cidade deve ser uma string',
  })
  @MaxLength(100, {
    message: 'Cidade deve ter no máximo 100 caracteres',
  })
  @Transform(({ value }) => value?.trim())
  city?: string;

  @ApiPropertyOptional({
    description: 'País do usuário',
    example: 'Brasil',
    maxLength: 50,
  })
  @IsOptional()
  @IsString({
    message: 'País deve ser uma string',
  })
  @MaxLength(50, {
    message: 'País deve ter no máximo 50 caracteres',
  })
  @Transform(({ value }) => value?.trim())
  country?: string;

  @ApiPropertyOptional({
    description: 'Timezone do usuário',
    example: 'America/Sao_Paulo',
    maxLength: 50,
  })
  @IsOptional()
  @IsString({
    message: 'Timezone deve ser uma string',
  })
  @MaxLength(50, {
    message: 'Timezone deve ter no máximo 50 caracteres',
  })
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Idioma preferido do usuário',
    example: 'pt-BR',
    maxLength: 20,
  })
  @IsOptional()
  @IsString({
    message: 'Idioma preferido deve ser uma string',
  })
  @MaxLength(20, {
    message: 'Idioma preferido deve ter no máximo 20 caracteres',
  })
  preferredLanguage?: string;
}
