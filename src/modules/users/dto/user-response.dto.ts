import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';
import { UserRole, UserStatus } from './create-user.dto';

/**
 * DTO para resposta de usuário
 * 
 * @description Estrutura de retorno de dados do usuário (sem dados sensíveis)
 * @author NeuralContent Team
 * @since 1.0.0
 */
export class UserResponseDto {
  @ApiProperty({
    description: 'ID único do usuário',
    example: 1,
  })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'usuario@neuralcontent.com',
  })
  @Expose()
  email: string;

  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'João Silva Santos',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Papel do usuário no sistema',
    enum: UserRole,
    example: UserRole.USER,
  })
  @Expose()
  role: UserRole;

  @ApiProperty({
    description: 'Status do usuário',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  @Expose()
  status: UserStatus;

  @ApiProperty({
    description: 'Se o email foi verificado',
    example: true,
  })
  @Expose()
  isEmailVerified: boolean;

  @ApiProperty({
    description: 'URL do avatar do usuário',
    example: 'https://gravatar.com/avatar/hash',
    required: false,
  })
  @Expose()
  avatarUrl?: string;

  @ApiPropertyOptional({
    description: 'Telefone de contato do usuário',
    example: '+55 11 99999-9999',
  })
  @Expose()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Biografia ou descrição do usuário',
    example: 'Desenvolvedor apaixonado por tecnologia e inovação.',
  })
  @Expose()
  bio?: string;

  @ApiPropertyOptional({
    description: 'Cidade do usuário',
    example: 'São Paulo',
  })
  @Expose()
  city?: string;

  @ApiPropertyOptional({
    description: 'País do usuário',
    example: 'Brasil',
  })
  @Expose()
  country?: string;

  @ApiPropertyOptional({
    description: 'Timezone do usuário',
    example: 'America/Sao_Paulo',
  })
  @Expose()
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Idioma preferido do usuário',
    example: 'pt-BR',
  })
  @Expose()
  preferredLanguage?: string;

  @ApiProperty({
    description: 'Data de criação do usuário',
    example: '2025-07-13T10:30:00Z',
  })
  @Expose()
  @Transform(({ value }) => value?.toISOString())
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2025-07-13T15:45:00Z',
  })
  @Expose()
  @Transform(({ value }) => value?.toISOString())
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Data do último login',
    example: '2025-07-13T14:20:00Z',
  })
  @Expose()
  @Transform(({ value }) => value?.toISOString())
  lastLoginAt?: Date;

  // Campos excluídos da resposta
  @Exclude()
  password: string;

  @Exclude()
  emailVerificationToken: string;

  @Exclude()
  passwordResetToken: string;

  @Exclude()
  failedLoginAttempts: number;

  @Exclude()
  lockedUntil: Date;

  @Exclude()
  metadata: any;

  @Exclude()
  deletedAt: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}

/**
 * DTO para lista paginada de usuários
 * 
 * @description Estrutura de retorno para listas paginadas
 * @author NeuralContent Team
 * @since 1.0.0
 */
export class UserListResponseDto {
  @ApiProperty({
    description: 'Lista de usuários',
    type: [UserResponseDto],
  })
  data: UserResponseDto[];

  @ApiProperty({
    description: 'Metadados de paginação',
    example: {
      total: 150,
      page: 1,
      limit: 10,
      totalPages: 15,
    },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * DTO para estatísticas de usuários
 * 
 * @description Estrutura para retorno de estatísticas
 * @author NeuralContent Team
 * @since 1.0.0
 */
export class UserStatsResponseDto {
  @ApiProperty({
    description: 'Total de usuários cadastrados',
    example: 1520,
  })
  totalUsers: number;

  @ApiProperty({
    description: 'Usuários ativos',
    example: 1245,
  })
  activeUsers: number;

  @ApiProperty({
    description: 'Usuários pendentes',
    example: 120,
  })
  pendingUsers: number;

  @ApiProperty({
    description: 'Usuários suspensos',
    example: 155,
  })
  suspendedUsers: number;

  @ApiProperty({
    description: 'Novos usuários hoje',
    example: 15,
  })
  newUsersToday: number;

  @ApiProperty({
    description: 'Novos usuários esta semana',
    example: 89,
  })
  newUsersThisWeek: number;

  @ApiProperty({
    description: 'Novos usuários este mês',
    example: 356,
  })
  newUsersThisMonth: number;
}
