import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';
import { UserRole } from './create-user.dto';

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
    description: 'Primeiro nome do usuário',
    example: 'João',
  })
  @Expose()
  firstName: string;

  @ApiProperty({
    description: 'Sobrenome do usuário',
    example: 'Silva Santos',
  })
  @Expose()
  lastName: string;

  @ApiProperty({
    description: 'Papel do usuário no sistema',
    enum: UserRole,
    example: UserRole.USER,
  })
  @Expose()
  role: UserRole;

  @ApiProperty({
    description: 'Se o usuário está ativo',
    example: true,
  })
  @Expose()
  isActive: boolean;

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
  avatar?: string;

  @ApiPropertyOptional({
    description: 'Data de verificação do email',
    example: '2025-07-13T10:30:00Z',
  })
  @Expose()
  @Transform(({ value }) => value?.toISOString())
  emailVerifiedAt?: Date;

  @ApiPropertyOptional({
    description: 'Telefone de contato do usuário',
    example: '+55 11 99999-9999',
  })
  @Expose()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Preferências do usuário',
    example: { theme: 'dark', language: 'pt-BR' },
  })
  @Expose()
  preferences?: Record<string, any>;

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
  deletedAt: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);

    // Mapear o nome completo se não estiver presente
    if (!this.firstName && !this.lastName && (partial as any).name) {
      const nameParts = (partial as any).name.split(' ');
      this.firstName = nameParts[0];
      this.lastName = nameParts.slice(1).join(' ');
    }
  }

  /**
   * Retorna o nome completo do usuário
   */
  getFullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
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
    description: 'Usuários inativos',
    example: 275,
  })
  inactiveUsers: number;

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
