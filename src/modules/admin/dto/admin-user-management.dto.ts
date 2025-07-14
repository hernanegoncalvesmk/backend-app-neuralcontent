import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsEmail, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  SUPER_ADMIN = 'super_admin',
}

export class AdminUserFilterDto {
  @ApiProperty({
    description: 'Filtrar por status do usuário',
    enum: UserStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiProperty({
    description: 'Filtrar por role do usuário',
    enum: UserRole,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({
    description: 'Buscar por nome ou email',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Página da listagem',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Itens por página',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class AdminUpdateUserDto {
  @ApiProperty({
    description: 'Nome do usuário',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Email do usuário',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Status do usuário',
    enum: UserStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiProperty({
    description: 'Role do usuário',
    enum: UserRole,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({
    description: 'Se o email foi verificado',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;

  @ApiProperty({
    description: 'Créditos do usuário',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  credits?: number;
}

export class AdminUserResponseDto {
  @ApiProperty({ description: 'ID do usuário' })
  id: string;

  @ApiProperty({ description: 'Nome do usuário' })
  name: string;

  @ApiProperty({ description: 'Email do usuário' })
  email: string;

  @ApiProperty({ description: 'Status do usuário', enum: UserStatus })
  status: UserStatus;

  @ApiProperty({ description: 'Role do usuário', enum: UserRole })
  role: UserRole;

  @ApiProperty({ description: 'Se o email foi verificado' })
  emailVerified: boolean;

  @ApiProperty({ description: 'Créditos disponíveis' })
  credits: number;

  @ApiProperty({ description: 'Data de cadastro' })
  createdAt: Date;

  @ApiProperty({ description: 'Último login' })
  lastLoginAt?: Date;

  @ApiProperty({ description: 'Plano atual' })
  currentPlan?: string;

  @ApiProperty({ description: 'Total gasto' })
  totalSpent: number;

  @ApiProperty({ description: 'Total de créditos consumidos' })
  totalCreditsConsumed: number;
}

export class AdminUserListResponseDto {
  @ApiProperty({ description: 'Lista de usuários', type: [AdminUserResponseDto] })
  users: AdminUserResponseDto[];

  @ApiProperty({ description: 'Total de usuários encontrados' })
  total: number;

  @ApiProperty({ description: 'Página atual' })
  page: number;

  @ApiProperty({ description: 'Itens por página' })
  limit: number;

  @ApiProperty({ description: 'Total de páginas' })
  totalPages: number;
}

export class AdminBulkActionDto {
  @ApiProperty({
    description: 'IDs dos usuários para ação em lote',
    type: [String],
  })
  @IsString({ each: true })
  userIds: string[];

  @ApiProperty({
    description: 'Ação a ser executada',
    enum: ['activate', 'suspend', 'ban', 'delete', 'add_credits'],
  })
  @IsEnum(['activate', 'suspend', 'ban', 'delete', 'add_credits'])
  action: string;

  @ApiProperty({
    description: 'Valor para ações que precisam (ex: créditos)',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  value?: number;
}
