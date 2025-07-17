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

@Entity('pln_features')
@Index(['keyName'], { unique: true })
@Index(['category'])
@Index(['isActive'])
export class Feature {
  @ApiProperty({
    description: 'ID único da feature',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Chave única da feature',
    example: 'unlimited_translations',
    maxLength: 100,
  })
  @Column({ name: 'key_name', type: 'varchar', length: 100, unique: true })
  keyName: string;

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
    description: 'Categoria da feature',
    example: 'translation',
    maxLength: 50,
    required: false,
  })
  @Column({ type: 'varchar', length: 50, nullable: true })
  category: string;

  @ApiProperty({
    description: 'Se a feature está ativa no sistema',
    example: true,
  })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({
    description: 'Data de criação da feature',
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
    description: 'Relacionamentos com planos que possuem esta feature',
    type: 'array',
    items: { type: 'object' },
  })
  @OneToMany('PlanFeature', 'feature')
  planFeatures: any[];

  // Computed properties
  @ApiProperty({
    description: 'Se a feature está disponível para uso',
    example: true,
  })
  get isAvailable(): boolean {
    return this.isActive;
  }

  @ApiProperty({
    description: 'Categoria formatada para exibição',
    example: 'Translation',
  })
  get categoryDisplay(): string {
    if (!this.category) return 'General';
    return this.category.charAt(0).toUpperCase() + this.category.slice(1);
  }
}
