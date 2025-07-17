import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';

/**
 * DTO de resposta para saldo de créditos
 *
 * @description Formata dados de saldo de créditos para resposta da API
 * @author NeuralContent Team
 * @since 1.0.0
 */
export class CreditBalanceResponseDto {
  @ApiProperty({
    description: 'ID único do registro de saldo',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'ID único do usuário',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  userId: string;

  @ApiProperty({
    description: 'Créditos mensais disponíveis no ciclo atual',
    example: 1000,
  })
  @Expose()
  @Transform(({ value }) => parseInt(value))
  monthlyCredits: number;

  @ApiProperty({
    description: 'Créditos mensais já utilizados no ciclo atual',
    example: 250,
  })
  @Expose()
  @Transform(({ value }) => parseInt(value))
  monthlyUsed: number;

  @ApiProperty({
    description: 'Data do próximo reset mensal de créditos',
    example: '2025-08-13T12:00:00Z',
  })
  @Expose()
  @Transform(({ value }) =>
    value instanceof Date ? value.toISOString() : value,
  )
  monthlyResetAt: Date;

  @ApiProperty({
    description: 'Créditos extras acumulados (não resetam mensalmente)',
    example: 500,
  })
  @Expose()
  @Transform(({ value }) => parseInt(value))
  extraCredits: number;

  @ApiProperty({
    description: 'Créditos extras já utilizados',
    example: 50,
  })
  @Expose()
  @Transform(({ value }) => parseInt(value))
  extraUsed: number;

  @ApiProperty({
    description: 'Total de créditos já consumidos historicamente',
    example: 5000,
  })
  @Expose()
  @Transform(({ value }) => parseInt(value))
  totalConsumed: number;

  @ApiProperty({
    description: 'Data da última sincronização com transações',
    example: '2025-01-13T12:00:00Z',
    required: false,
  })
  @Expose()
  @Transform(({ value }) =>
    value instanceof Date ? value.toISOString() : value,
  )
  lastSyncAt?: Date;

  @ApiProperty({
    description: 'Data de criação do registro',
    example: '2025-01-13T12:00:00Z',
  })
  @Expose()
  @Transform(({ value }) =>
    value instanceof Date ? value.toISOString() : value,
  )
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2025-01-13T12:00:00Z',
  })
  @Expose()
  @Transform(({ value }) =>
    value instanceof Date ? value.toISOString() : value,
  )
  updatedAt: Date;

  @ApiProperty({
    description: 'Créditos mensais disponíveis (calculado)',
    example: 750,
  })
  @Expose()
  @Transform(({ obj }) => {
    const monthlyAvailable =
      parseInt(obj.monthlyCredits) - parseInt(obj.monthlyUsed);
    return Math.max(0, monthlyAvailable);
  })
  monthlyAvailable: number;

  @ApiProperty({
    description: 'Créditos extras disponíveis (calculado)',
    example: 450,
  })
  @Expose()
  @Transform(({ obj }) => {
    const extraAvailable = parseInt(obj.extraCredits) - parseInt(obj.extraUsed);
    return Math.max(0, extraAvailable);
  })
  extraAvailable: number;

  @ApiProperty({
    description: 'Total de créditos disponíveis (mensal + extra)',
    example: 1200,
  })
  @Expose()
  @Transform(({ obj }) => {
    const monthlyAvailable = Math.max(
      0,
      parseInt(obj.monthlyCredits) - parseInt(obj.monthlyUsed),
    );
    const extraAvailable = Math.max(
      0,
      parseInt(obj.extraCredits) - parseInt(obj.extraUsed),
    );
    return monthlyAvailable + extraAvailable;
  })
  totalAvailable: number;

  @ApiProperty({
    description: 'Percentual de créditos mensais utilizados',
    example: 25.0,
  })
  @Expose()
  @Transform(({ obj }) => {
    const monthlyCredits = parseInt(obj.monthlyCredits);
    if (monthlyCredits === 0) return 0;
    const monthlyUsed = parseInt(obj.monthlyUsed);
    return parseFloat(((monthlyUsed / monthlyCredits) * 100).toFixed(2));
  })
  monthlyUsagePercent: number;

  @ApiProperty({
    description: 'Dias restantes até o próximo reset mensal',
    example: 18,
  })
  @Expose()
  @Transform(({ obj }) => {
    const resetDate = new Date(obj.monthlyResetAt);
    const now = new Date();
    const diffTime = resetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  })
  daysUntilReset: number;

  @ApiProperty({
    description: 'Status do saldo (low, medium, high)',
    example: 'medium',
  })
  @Expose()
  @Transform(({ obj }) => {
    const totalAvailable =
      parseInt(obj.monthlyCredits) -
      parseInt(obj.monthlyUsed) +
      parseInt(obj.extraCredits) -
      parseInt(obj.extraUsed);

    if (totalAvailable <= 100) return 'low';
    if (totalAvailable <= 500) return 'medium';
    return 'high';
  })
  balanceStatus: string;
}
