import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Plan } from './plan.entity';
import { Feature } from './feature.entity';

@Entity('pln_plan_features')
@Index(['planId'])
@Index(['featureId'])
@Index(['planId', 'featureId'], { unique: true })
export class PlanFeature {
  @ApiProperty({
    description: 'ID único do relacionamento plano-feature',
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
    description: 'ID da feature',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ name: 'feature_id', type: 'uuid' })
  featureId: string;

  @ApiProperty({
    description: 'Valor limite da feature (se aplicável)',
    example: 100,
    required: false,
  })
  @Column({ name: 'limit_value', type: 'int', nullable: true })
  limitValue: number;

  @ApiProperty({
    description: 'Se a feature está habilitada neste plano',
    example: true,
  })
  @Column({ name: 'is_enabled', type: 'boolean', default: true })
  isEnabled: boolean;

  @ApiProperty({
    description: 'Data de criação do relacionamento',
    example: '2025-07-13T12:00:00Z',
  })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relationships
  @ApiProperty({
    description: 'Plano ao qual a feature pertence',
    type: () => Plan,
  })
  @ManyToOne(() => Plan, (plan) => plan.planFeatures, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  @ApiProperty({
    description: 'Feature associada ao plano',
    type: () => Feature,
  })
  @ManyToOne(() => Feature, (feature) => feature.planFeatures, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'feature_id' })
  feature: Feature;

  // Computed properties
  @ApiProperty({
    description: 'Se a feature está ativa e habilitada',
    example: true,
  })
  get isActive(): boolean {
    return this.isEnabled && this.feature?.isActive;
  }

  @ApiProperty({
    description: 'Se a feature tem limite definido',
    example: true,
  })
  get hasLimit(): boolean {
    return this.limitValue !== null && this.limitValue !== undefined;
  }

  @ApiProperty({
    description: 'Nome da feature (vem da entidade Feature)',
    example: 'Traduções Ilimitadas',
  })
  get featureName(): string {
    return this.feature?.name || '';
  }

  @ApiProperty({
    description: 'Descrição da feature (vem da entidade Feature)',
    example: 'Traduza documentos sem limites mensais',
  })
  get featureDescription(): string {
    return this.feature?.description || '';
  }
}
