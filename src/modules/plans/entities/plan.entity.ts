import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { PlanFeature } from './plan-feature.entity';

export enum PlanType {
  FREE = 'free',
  BASIC = 'basic',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
}

@Entity('pln_plans')
@Index(['isActive'])
@Index(['sortOrder'])
@Index(['type'])
export class Plan {
  @ApiProperty({
    description: 'ID único do plano',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Nome do plano',
    example: 'Premium',
    maxLength: 100,
  })
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ApiProperty({
    description: 'Slug único do plano para URLs',
    example: 'premium-plan',
    maxLength: 50,
  })
  @Column({ type: 'varchar', length: 50, unique: true })
  slug: string;

  @ApiProperty({
    description: 'Descrição detalhada do plano',
    example: 'Plano premium com recursos avançados',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({
    description: 'Tipo do plano',
    enum: PlanType,
    example: PlanType.PREMIUM,
  })
  @Column({
    type: 'enum',
    enum: PlanType,
    default: PlanType.FREE,
  })
  type: PlanType;

  @ApiProperty({
    description: 'Preço mensal em centavos',
    example: 2999,
    minimum: 0,
  })
  @Column({ name: 'monthly_price', type: 'int', default: 0 })
  monthlyPrice: number;

  @ApiProperty({
    description: 'Preço anual em centavos',
    example: 29990,
    minimum: 0,
  })
  @Column({ name: 'annual_price', type: 'int', default: 0 })
  annualPrice: number;

  @ApiProperty({
    description: 'Créditos mensais inclusos no plano',
    example: 1000,
    minimum: 0,
  })
  @Column({ name: 'monthly_credits', type: 'int', default: 0 })
  monthlyCredits: number;

  @ApiProperty({
    description: 'Se o plano está ativo e disponível',
    example: true,
  })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({
    description: 'Se o plano é destacado na lista',
    example: false,
  })
  @Column({ name: 'is_featured', type: 'boolean', default: false })
  isFeatured: boolean;

  @ApiProperty({
    description: 'Ordem de exibição do plano',
    example: 1,
    minimum: 0,
  })
  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @ApiProperty({
    description: 'Metadados adicionais do plano',
    example: { color: '#007bff', icon: 'star' },
    required: false,
  })
  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @ApiProperty({
    description: 'Data de criação do plano',
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
    description: 'Funcionalidades do plano',
    type: () => [PlanFeature],
    required: false,
  })
  @OneToMany(() => PlanFeature, (feature) => feature.plan, {
    cascade: true,
    eager: false,
  })
  features: PlanFeature[];
}
