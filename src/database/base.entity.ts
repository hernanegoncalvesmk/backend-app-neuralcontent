import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  VersionColumn,
  BaseEntity as TypeOrmBaseEntity,
} from 'typeorm';

/**
 * BaseEntity - Entidade base para todas as entidades do sistema
 *
 * Fornece campos comuns para auditoria e controle de versão:
 * - id: Chave primária auto-incrementável
 * - createdAt: Data/hora de criação
 * - updatedAt: Data/hora da última atualização
 * - deletedAt: Data/hora de soft delete
 * - version: Controle de versão otimista
 */
export abstract class BaseEntity extends TypeOrmBaseEntity {
  @PrimaryGeneratedColumn('increment', {
    comment: 'Identificador único auto-incrementável',
  })
  id: number;

  @CreateDateColumn({
    type: 'datetime',
    precision: 6,
    default: () => 'CURRENT_TIMESTAMP(6)',
    comment: 'Data e hora de criação do registro',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'datetime',
    precision: 6,
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
    comment: 'Data e hora da última atualização do registro',
  })
  updatedAt: Date;

  @DeleteDateColumn({
    type: 'datetime',
    precision: 6,
    nullable: true,
    comment: 'Data e hora de soft delete do registro',
  })
  deletedAt?: Date;

  @VersionColumn({
    comment: 'Versão do registro para controle de concorrência otimista',
  })
  version: number;
}
