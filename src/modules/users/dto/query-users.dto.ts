import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsString,
  IsEnum,
  IsDateString,
  IsBoolean,
} from 'class-validator';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  SUPPORT = 'support',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class QueryUsersDto {
  @ApiPropertyOptional({
    description: 'Número da página (começando em 1)',
    minimum: 1,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page deve ser um número inteiro' })
  @Min(1, { message: 'Page deve ser pelo menos 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Número de itens por página',
    minimum: 1,
    maximum: 100,
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit deve ser um número inteiro' })
  @Min(1, { message: 'Limit deve ser pelo menos 1' })
  @Max(100, { message: 'Limit não pode ser maior que 100' })
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Campo para ordenação',
    example: 'createdAt',
    enum: ['id', 'email', 'firstName', 'lastName', 'createdAt', 'updatedAt'],
  })
  @IsOptional()
  @IsString({ message: 'SortBy deve ser uma string' })
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Ordem da classificação',
    enum: SortOrder,
    example: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder, { message: 'SortOrder deve ser ASC ou DESC' })
  sortOrder?: SortOrder = SortOrder.DESC;

  @ApiPropertyOptional({
    description: 'Filtrar por email (busca parcial)',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsString({ message: 'Email deve ser uma string' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por nome (busca parcial)',
    example: 'João',
  })
  @IsOptional()
  @IsString({ message: 'FirstName deve ser uma string' })
  @Transform(({ value }) => value?.trim())
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por sobrenome (busca parcial)',
    example: 'Silva',
  })
  @IsOptional()
  @IsString({ message: 'LastName deve ser uma string' })
  @Transform(({ value }) => value?.trim())
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por role do usuário',
    enum: UserRole,
    example: UserRole.USER,
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Role deve ser um valor válido' })
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Filtrar por status do usuário',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(UserStatus, { message: 'Status deve ser um valor válido' })
  status?: UserStatus;

  @ApiPropertyOptional({
    description: 'Filtrar por usuários verificados',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'IsVerified deve ser um boolean' })
  isVerified?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrar por data de criação (depois de)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString({}, { message: 'CreatedAfter deve ser uma data válida' })
  createdAfter?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por data de criação (antes de)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString({}, { message: 'CreatedBefore deve ser uma data válida' })
  createdBefore?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por cidade',
    example: 'São Paulo',
  })
  @IsOptional()
  @IsString({ message: 'City deve ser uma string' })
  @Transform(({ value }) => value?.trim())
  city?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por país',
    example: 'Brazil',
  })
  @IsOptional()
  @IsString({ message: 'Country deve ser uma string' })
  @Transform(({ value }) => value?.trim())
  country?: string;

  @ApiPropertyOptional({
    description: 'Busca geral (nome, email, cidade)',
    example: 'joão',
  })
  @IsOptional()
  @IsString({ message: 'Search deve ser uma string' })
  @Transform(({ value }) => value?.trim())
  search?: string;
}
