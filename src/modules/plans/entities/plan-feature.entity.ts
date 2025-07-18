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

@Entity('pln_plan_features')
@Index(['planId'])
@Index(['featureKey'])
export class PlanFeature {
  @ApiProperty({
    description: 'ID único da funcionalidade do plano',
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
    description: 'Chave única da funcionalidade',
    example: 'unlimited_translations',
    maxLength: 100,
  })
  @Column({ name: 'feature_key', type: 'varchar', length: 100 })
  featureKey: string;

  @ApiProperty({
    description: 'Nome da funcionalidade',
    example: 'Traduções Ilimitadas',
    maxLength: 100,
  })
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ApiProperty({
    description: 'Descrição da funcionalidade',
    example: 'Traduza documentos sem limites mensais',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({
    description: 'Valor limite da funcionalidade (ex: 100 traduções)',
    example: 100,
    required: false,
  })
  @Column({ name: 'limit_value', type: 'int', nullable: true })
  limitValue: number;

  @ApiProperty({
    description: 'Unidade do limite (ex: translations, documents)',
    example: 'translations',
    required: false,
  })
  @Column({ name: 'limit_unit', type: 'varchar', length: 50, nullable: true })
  limitUnit: string;

  @ApiProperty({
    description: 'Se a funcionalidade está habilitada neste plano',
    example: true,
  })
  @Column({ name: 'is_enabled', type: 'boolean', default: true })
  isEnabled: boolean;

  @ApiProperty({
    description: 'Ordem de exibição da funcionalidade',
    example: 1,
    minimum: 0,
  })
  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @ApiProperty({
    description: 'Metadados adicionais da funcionalidade',
    example: { icon: 'translate', color: '#28a745' },
    required: false,
  })
  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @ApiProperty({
    description: 'Data de criação da funcionalidade',
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
    description: 'Plano ao qual a funcionalidade pertence',
    type: () => Plan,
  })
  @ManyToOne(() => Plan, (plan) => plan.features, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;
}
