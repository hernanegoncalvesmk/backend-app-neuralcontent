import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Plan } from './plan.entity';

export enum BillingPeriod {
  MONTHLY = 'month',
  YEARLY = 'year',
}

export enum Currency {
  BRL = 'BRL',
  USD = 'USD',
  EUR = 'EUR',
}

@Entity('pln_plan_prices')
@Index(['planId'])
@Index(['currency'])
@Index(['isActive'])
@Index(['planId', 'currency', 'intervalType'], { unique: true })
export class PlanPrice {
  @ApiProperty({
    description: 'ID único do preço do plano',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'ID do plano',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ name: 'plan_id', type: 'uuid' })
  planId: string;

  @ApiProperty({
    description: 'Moeda do preço',
    enum: Currency,
    example: Currency.BRL,
  })
  @Column({
    type: 'char',
    length: 3,
    default: Currency.BRL,
  })
  currency: Currency;

  @ApiProperty({
    description: 'Valor do preço em formato decimal',
    example: 29.99,
    minimum: 0,
  })
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  amount: number;

  @ApiProperty({
    description: 'Tipo de período de cobrança',
    enum: BillingPeriod,
    example: BillingPeriod.MONTHLY,
  })
  @Column({
    name: 'interval_type',
    type: 'enum',
    enum: BillingPeriod,
    default: BillingPeriod.MONTHLY,
  })
  intervalType: BillingPeriod;

  @ApiProperty({
    description: 'Quantidade de intervalos',
    example: 1,
    minimum: 1,
  })
  @Column({
    name: 'interval_count',
    type: 'int',
    default: 1,
  })
  intervalCount: number;

  @ApiProperty({
    description: 'Se o preço está ativo e disponível',
    example: true,
  })
  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Data de criação do preço',
    example: '2025-07-13T12:00:00Z',
  })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2025-07-13T12:00:00Z',
  })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ApiProperty({
    description: 'Plano ao qual este preço pertence',
    type: () => Plan,
  })
  @ManyToOne(() => Plan, (plan) => plan.prices, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  // Computed properties
  @ApiProperty({
    description: 'Valor formatado com símbolo da moeda',
    example: 'R$ 29,99',
  })
  get formattedAmount(): string {
    const symbols = {
      [Currency.BRL]: 'R$',
      [Currency.USD]: '$',
      [Currency.EUR]: '€',
    };

    const symbol = symbols[this.currency] || this.currency;
    const amount = Number(this.amount).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return `${symbol} ${amount}`;
  }

  @ApiProperty({
    description: 'Descrição do período de cobrança',
    example: 'Mensal',
  })
  get intervalDescription(): string {
    const descriptions = {
      [BillingPeriod.MONTHLY]: 'Mensal',
      [BillingPeriod.YEARLY]: 'Anual',
    };

    const baseDescription =
      descriptions[this.intervalType] || this.intervalType;

    if (this.intervalCount > 1) {
      return `${this.intervalCount}x ${baseDescription}`;
    }

    return baseDescription;
  }

  @ApiProperty({
    description: 'Se é um plano anual (para aplicar descontos)',
    example: false,
  })
  get isYearly(): boolean {
    return this.intervalType === BillingPeriod.YEARLY;
  }

  @ApiProperty({
    description: 'Valor mensal equivalente (para comparação)',
    example: 29.99,
  })
  get monthlyEquivalent(): number {
    if (this.intervalType === BillingPeriod.MONTHLY) {
      return Number(this.amount);
    }

    if (this.intervalType === BillingPeriod.YEARLY) {
      return Number(this.amount) / 12;
    }

    return Number(this.amount) / (this.intervalCount || 1);
  }
}
