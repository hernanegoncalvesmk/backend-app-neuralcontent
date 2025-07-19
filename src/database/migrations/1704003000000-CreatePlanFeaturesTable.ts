import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

/**
 * Migration: CreatePlanFeaturesTable
 * 
 * Cria a tabela de recursos dos planos para:
 * - Gestão granular de funcionalidades
 * - Controle de acesso por recurso
 * - Flexibilidade na configuração
 * - Histórico de mudanças de recursos
 * 
 * @author Arquiteto de Sistemas Senior
 * @version 1.0.0
 * @date 2024-01-04
 */
export class CreatePlanFeaturesTable1704003000000 implements MigrationInterface {
  name = 'CreatePlanFeaturesTable1704003000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela pln_plan_features
    await queryRunner.createTable(
      new Table({
        name: 'pln_plan_features',
        columns: [
          // Campos da BaseEntity
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            comment: 'Identificador único auto-incrementável',
          },
          {
            name: 'created_at',
            type: 'datetime',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6)',
            comment: 'Data e hora de criação do registro',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6)',
            onUpdate: 'CURRENT_TIMESTAMP(6)',
            comment: 'Data e hora da última atualização do registro',
          },
          {
            name: 'deletedAt',
            type: 'datetime',
            precision: 6,
            isNullable: true,
            comment: 'Data e hora de soft delete do registro',
          },
          {
            name: 'version',
            type: 'int',
            default: 1,
            comment: 'Versão do registro para controle de concorrência otimista',
          },

          // Campos específicos da feature
          {
            name: 'plan_id',
            type: 'varchar',
            length: '36',
            comment: 'ID do plano ao qual a feature pertence',
          },
          {
            name: 'feature_key',
            type: 'varchar',
            length: '100',
            comment: 'Chave única da funcionalidade',
          },
          {
            name: 'feature_name',
            type: 'varchar',
            length: '150',
            comment: 'Nome amigável da funcionalidade',
          },
          {
            name: 'feature_description',
            type: 'text',
            isNullable: true,
            comment: 'Descrição detalhada da funcionalidade',
          },
          {
            name: 'feature_type',
            type: 'enum',
            enum: ['boolean', 'limit', 'quota', 'access', 'integration'],
            comment: 'Tipo da funcionalidade',
          },
          {
            name: 'feature_value',
            type: 'json',
            isNullable: true,
            comment: 'Valor/configuração da funcionalidade',
          },
          {
            name: 'is_enabled',
            type: 'boolean',
            default: true,
            comment: 'Indica se a funcionalidade está habilitada',
          },
          {
            name: 'is_unlimited',
            type: 'boolean',
            default: false,
            comment: 'Indica se a funcionalidade é ilimitada',
          },
          {
            name: 'numeric_limit',
            type: 'bigint',
            isNullable: true,
            comment: 'Limite numérico para funcionalidades quantitativas',
          },
          {
            name: 'unit_type',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'Tipo de unidade (GB, requests, users, etc.)',
          },
          {
            name: 'display_order',
            type: 'int',
            default: 0,
            comment: 'Ordem de exibição da funcionalidade',
          },
          {
            name: 'is_highlight',
            type: 'boolean',
            default: false,
            comment: 'Indica se deve ser destacada na apresentação',
          },
          {
            name: 'icon_name',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'Nome do ícone para exibição',
          },
          {
            name: 'category',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'Categoria da funcionalidade',
          },
          {
            name: 'metadata',
            type: 'json',
            isNullable: true,
            comment: 'Metadados adicionais da funcionalidade',
          },
        ],
        indices: [
          // Índices para performance
          {
            name: 'idx_pln_plan_features_plan_id',
            columnNames: ['plan_id'],
          },
          {
            name: 'idx_pln_plan_features_feature_key',
            columnNames: ['feature_key'],
          },
          {
            name: 'idx_pln_plan_features_feature_type',
            columnNames: ['feature_type'],
          },
          {
            name: 'idx_pln_plan_features_is_enabled',
            columnNames: ['is_enabled'],
          },
          {
            name: 'idx_pln_plan_features_is_unlimited',
            columnNames: ['is_unlimited'],
          },
          {
            name: 'idx_pln_plan_features_display_order',
            columnNames: ['display_order'],
          },
          {
            name: 'idx_pln_plan_features_is_highlight',
            columnNames: ['is_highlight'],
          },
          {
            name: 'idx_pln_plan_features_category',
            columnNames: ['category'],
          },
          
          // Índices compostos
          {
            name: 'idx_pln_plan_features_plan_key',
            columnNames: ['plan_id', 'feature_key'],
            isUnique: true,
          },
          {
            name: 'idx_pln_plan_features_plan_enabled',
            columnNames: ['plan_id', 'is_enabled'],
          },
          {
            name: 'idx_pln_plan_features_plan_order',
            columnNames: ['plan_id', 'display_order'],
          },
          {
            name: 'idx_pln_plan_features_type_enabled',
            columnNames: ['feature_type', 'is_enabled'],
          },
        ],
      }),
      true, // ifNotExists
    );

    // Criar foreign key para plans
    await queryRunner.createForeignKey(
      'pln_plan_features',
      new TableForeignKey({
        columnNames: ['plan_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'pln_plans',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        name: 'fk_pln_plan_features_plan_id',
      }),
    );

    console.log('✅ Tabela pln_plan_features criada com sucesso');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover foreign key primeiro
    await queryRunner.dropForeignKey('pln_plan_features', 'fk_pln_plan_features_plan_id');
    
    // Remover tabela
    await queryRunner.dropTable('pln_plan_features');
    
    console.log('✅ Tabela pln_plan_features removida com sucesso');
  }
}
