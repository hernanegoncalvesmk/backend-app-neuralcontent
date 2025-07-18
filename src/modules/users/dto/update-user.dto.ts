import { PartialType, OmitType } from '@nestjs/mapped-types';
import { IsOptional, IsString, MinLength, MaxLength, IsEnum, IsBoolean, Matches } from 'class-validator';
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

  @ApiPropertyOptional({
    description: 'Telefone de contato do usuário',
    example: '+55 11 99999-9999',
    maxLength: 50,
  })
  @IsOptional()
  @IsString({
    message: 'Telefone deve ser uma string',
  })
  @MaxLength(50, {
    message: 'Telefone deve ter no máximo 50 caracteres',
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

  @ApiPropertyOptional({
    description: 'Preferência para receber notificações por email',
    example: true,
  })
  @IsOptional()
  @IsBoolean({
    message: 'emailNotifications deve ser um boolean',
  })
  emailNotifications?: boolean;

  @ApiPropertyOptional({
    description: 'Preferência para receber newsletters e emails de marketing',
    example: false,
  })
  @IsOptional()
  @IsBoolean({
    message: 'marketingEmails deve ser um boolean',
  })
  marketingEmails?: boolean;
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
    minLength: 8,
    maxLength: 50,
  })
  @IsOptional()
  @IsString({
    message: 'Senha atual deve ser uma string',
  })
  @MinLength(8, {
    message: 'Senha atual deve ter pelo menos 8 caracteres',
  })
  @MaxLength(50, {
    message: 'Senha atual deve ter no máximo 50 caracteres',
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
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message: 'Nova senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial',
    }
  )
  newPassword: string;

  @ApiPropertyOptional({
    description: 'Confirmação da nova senha',
    example: 'MinhaNov@Senha123!',
    minLength: 8,
    maxLength: 50,
  })
  @IsString({
    message: 'Confirmação de senha deve ser uma string',
  })
  @MinLength(8, {
    message: 'Confirmação de senha deve ter pelo menos 8 caracteres',
  })
  @MaxLength(50, {
    message: 'Confirmação de senha deve ter no máximo 50 caracteres',
  })
  confirmPassword: string;
}
