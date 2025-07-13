import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UserStatisticsDto {
  @ApiProperty({
    description: 'Total de usuários',
    example: 1000,
  })
  @Expose()
  totalUsers: number;

  @ApiProperty({
    description: 'Usuários ativos',
    example: 850,
  })
  @Expose()
  activeUsers: number;

  @ApiProperty({
    description: 'Usuários inativos',
    example: 100,
  })
  @Expose()
  inactiveUsers: number;

  @ApiProperty({
    description: 'Usuários pendentes de verificação',
    example: 50,
  })
  @Expose()
  pendingUsers: number;

  @ApiProperty({
    description: 'Usuários suspensos',
    example: 10,
  })
  @Expose()
  suspendedUsers: number;

  @ApiProperty({
    description: 'Usuários banidos',
    example: 5,
  })
  @Expose()
  bannedUsers: number;

  @ApiProperty({
    description: 'Usuários verificados',
    example: 900,
  })
  @Expose()
  verifiedUsers: number;

  @ApiProperty({
    description: 'Usuários não verificados',
    example: 100,
  })
  @Expose()
  unverifiedUsers: number;

  @ApiProperty({
    description: 'Novos usuários hoje',
    example: 25,
  })
  @Expose()
  newUsersToday: number;

  @ApiProperty({
    description: 'Novos usuários esta semana',
    example: 150,
  })
  @Expose()
  newUsersThisWeek: number;

  @ApiProperty({
    description: 'Novos usuários este mês',
    example: 600,
  })
  @Expose()
  newUsersThisMonth: number;

  @ApiProperty({
    description: 'Distribuição por role',
    example: {
      user: 900,
      admin: 5,
      moderator: 10,
      support: 15,
    },
  })
  @Expose()
  roleDistribution: Record<string, number>;

  @ApiProperty({
    description: 'Top 10 países por número de usuários',
    example: [
      { country: 'Brazil', count: 400 },
      { country: 'United States', count: 300 },
      { country: 'Argentina', count: 150 },
    ],
  })
  @Expose()
  topCountries: Array<{ country: string; count: number }>;

  @ApiProperty({
    description: 'Data da última atualização das estatísticas',
    example: '2024-01-15T10:30:00Z',
  })
  @Expose()
  lastUpdated: Date;

  constructor(partial: Partial<UserStatisticsDto>) {
    Object.assign(this, partial);
  }
}
