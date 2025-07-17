import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsEnum } from 'class-validator';

export enum StatsPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export class AdminStatsQueryDto {
  @ApiProperty({
    description: 'Data de início para as estatísticas',
    example: '2025-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'Data de fim para as estatísticas',
    example: '2025-12-31',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: 'Período das estatísticas',
    enum: StatsPeriod,
    example: StatsPeriod.MONTHLY,
    required: false,
  })
  @IsOptional()
  @IsEnum(StatsPeriod)
  period?: StatsPeriod;
}

export class UserStatsDto {
  @ApiProperty({ description: 'Total de usuários cadastrados' })
  totalUsers: number;

  @ApiProperty({ description: 'Novos usuários no período' })
  newUsers: number;

  @ApiProperty({ description: 'Usuários ativos no período' })
  activeUsers: number;

  @ApiProperty({ description: 'Usuários com planos premium' })
  premiumUsers: number;

  @ApiProperty({ description: 'Taxa de crescimento de usuários (%)' })
  growthRate: number;
}

export class RevenueStatsDto {
  @ApiProperty({ description: 'Receita total no período' })
  totalRevenue: number;

  @ApiProperty({ description: 'Receita média por usuário' })
  averageRevenuePerUser: number;

  @ApiProperty({ description: 'Número total de transações' })
  totalTransactions: number;

  @ApiProperty({ description: 'Taxa de conversão (%)' })
  conversionRate: number;

  @ApiProperty({ description: 'Crescimento da receita (%)' })
  revenueGrowthRate: number;
}

export class CreditsStatsDto {
  @ApiProperty({ description: 'Total de créditos consumidos' })
  totalCreditsConsumed: number;

  @ApiProperty({ description: 'Total de créditos adicionados' })
  totalCreditsAdded: number;

  @ApiProperty({ description: 'Média de créditos por usuário' })
  averageCreditsPerUser: number;

  @ApiProperty({ description: 'Usuários que mais consomem créditos' })
  topCreditConsumers: Array<{
    userId: string;
    userName: string;
    creditsConsumed: number;
  }>;
}

export class SystemStatsDto {
  @ApiProperty({ description: 'Total de requests à API' })
  totalApiRequests: number;

  @ApiProperty({ description: 'Tempo médio de resposta (ms)' })
  averageResponseTime: number;

  @ApiProperty({ description: 'Taxa de erro (%)' })
  errorRate: number;

  @ApiProperty({ description: 'Uptime do sistema (%)' })
  systemUptime: number;

  @ApiProperty({ description: 'Uso de memória (MB)' })
  memoryUsage: number;
}

export class AdminStatsResponseDto {
  @ApiProperty({ description: 'Estatísticas de usuários' })
  userStats: UserStatsDto;

  @ApiProperty({ description: 'Estatísticas de receita' })
  revenueStats: RevenueStatsDto;

  @ApiProperty({ description: 'Estatísticas de créditos' })
  creditsStats: CreditsStatsDto;

  @ApiProperty({ description: 'Estatísticas do sistema' })
  systemStats: SystemStatsDto;

  @ApiProperty({ description: 'Data/hora da consulta' })
  generatedAt: Date;

  @ApiProperty({ description: 'Período das estatísticas' })
  period: StatsPeriod;
}
