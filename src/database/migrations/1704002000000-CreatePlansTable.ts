import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/**
 * Migration: CreatePlansTable
 * 
 * Cria a tabela de planos de assinatura para:
 * - Gestão de planos de serviço
 * - Controle de preços e recursos
 * - Histórico de mudanças
 * - Configurações flexíveis
 * 
 * @author Arquiteto de Sistemas Senior
 * @version 1.0.0
 * @date 2024-01-03
 */
export class CreatePlansTable1704002000000 implements MigrationInterface {
  name = 'CreatePlansTable1704002000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela pln_plans
    await queryRunner.createTable(
      new Table({
        name: 'pln_plans',
        columns: [
          // Campos da BaseEntity
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
            comment: 'Identificador único UUID',
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

          // Campos específicos do plano
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            comment: 'Nome do plano',
          },
          {
            name: 'slug',
            type: 'varchar',
            length: '50',
            isUnique: true,
            comment: 'Slug único do plano para URLs',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
            comment: 'Descrição detalhada do plano',
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['free', 'basic', 'premium', 'enterprise'],
            default: "'free'",
            comment: 'Tipo/categoria do plano',
          },
          {
            name: 'monthly_price',
            type: 'int',
            default: 0,
            comment: 'Preço mensal em centavos',
          },
          {
            name: 'annual_price',
            type: 'int',
            default: 0,
            comment: 'Preço anual em centavos',
          },
          {
            name: 'monthly_credits',
            type: 'int',
            default: 0,
            comment: 'Créditos mensais inclusos no plano',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            comment: 'Indica se o plano está ativo',
          },
          {
            name: 'is_featured',
            type: 'boolean',
            default: false,
            comment: 'Indica se o plano deve ser destacado',
          },
          {
            name: 'sort_order',
            type: 'int',
            default: 0,
            comment: 'Ordem de exibição do plano',
          },
          {
            name: 'stripe_price_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'ID do preço no Stripe',
          },
        ],
        indices: [
          // Índices para performance
          {
            name: 'idx_pln_plans_slug',
            columnNames: ['slug'],
          },
          {
            name: 'idx_pln_plans_type',
            columnNames: ['type'],
          },
          {
            name: 'idx_pln_plans_is_active',
            columnNames: ['is_active'],
          },
          {
            name: 'idx_pln_plans_is_featured',
            columnNames: ['is_featured'],
          },
          {
            name: 'idx_pln_plans_sort_order',
            columnNames: ['sort_order'],
          },
          {
            name: 'idx_pln_plans_monthly_price',
            columnNames: ['monthly_price'],
          },
          {
            name: 'idx_pln_plans_stripe_price_id',
            columnNames: ['stripe_price_id'],
          },
          
          // Índices compostos
          {
            name: 'idx_pln_plans_active_featured',
            columnNames: ['is_active', 'is_featured'],
          },
          {
            name: 'idx_pln_plans_type_active',
            columnNames: ['type', 'is_active'],
          },
          {
            name: 'idx_pln_plans_active_order',
            columnNames: ['is_active', 'sort_order'],
          },
        ],
      }),
      true, // ifNotExists
    );

    console.log('✅ Tabela pln_plans criada com sucesso');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover tabela
    await queryRunner.dropTable('pln_plans');
    
    console.log('✅ Tabela pln_plans removida com sucesso');
  }
}
