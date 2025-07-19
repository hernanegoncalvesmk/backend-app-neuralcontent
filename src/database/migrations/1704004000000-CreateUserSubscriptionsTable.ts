import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

/**
 * Migration: CreateUserSubscriptionsTable
 * 
 * Cria a tabela de assinaturas dos usuários para:
 * - Gestão de assinaturas ativas
 * - Controle de períodos de cobrança
 * - Histórico de mudanças de plano
 * - Integração com sistemas de pagamento
 * 
 * @author Arquiteto de Sistemas Senior
 * @version 1.0.0
 * @date 2024-01-05
 */
export class CreateUserSubscriptionsTable1704004000000 implements MigrationInterface {
  name = 'CreateUserSubscriptionsTable1704004000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela pln_user_subscriptions
    await queryRunner.createTable(
      new Table({
        name: 'pln_user_subscriptions',
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

          // Campos específicos da assinatura
          {
            name: 'user_id',
            type: 'int',
            comment: 'ID do usuário que possui a assinatura',
          },
          {
            name: 'plan_id',
            type: 'varchar',
            length: '36',
            comment: 'ID do plano assinado',
          },
          {
            name: 'subscription_id',
            type: 'varchar',
            length: '255',
            isUnique: true,
            comment: 'ID único da assinatura (gerado pelo sistema)',
          },
          {
            name: 'external_subscription_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'ID da assinatura no gateway de pagamento',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'inactive', 'cancelled', 'expired', 'suspended', 'past_due', 'trialing'],
            comment: 'Status atual da assinatura',
          },
          {
            name: 'payment_status',
            type: 'enum',
            enum: ['pending', 'paid', 'failed', 'refunded', 'cancelled'],
            comment: 'Status do pagamento da assinatura',
          },
          {
            name: 'payment_method',
            type: 'enum',
            enum: ['credit_card', 'pix', 'boleto', 'paypal', 'stripe', 'free'],
            comment: 'Método de pagamento utilizado',
          },
          {
            name: 'billing_cycle',
            type: 'enum',
            enum: ['monthly', 'yearly', 'lifetime'],
            comment: 'Ciclo de cobrança da assinatura',
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            comment: 'Valor da assinatura em centavos',
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
            default: "'BRL'",
            comment: 'Moeda da assinatura (ISO 4217)',
          },
          {
            name: 'starts_at',
            type: 'datetime',
            precision: 6,
            comment: 'Data de início da assinatura',
          },
          {
            name: 'ends_at',
            type: 'datetime',
            precision: 6,
            isNullable: true,
            comment: 'Data de fim da assinatura',
          },
          {
            name: 'current_period_start',
            type: 'datetime',
            precision: 6,
            comment: 'Início do período atual de cobrança',
          },
          {
            name: 'current_period_end',
            type: 'datetime',
            precision: 6,
            comment: 'Fim do período atual de cobrança',
          },
          {
            name: 'trial_starts_at',
            type: 'datetime',
            precision: 6,
            isNullable: true,
            comment: 'Data de início do período de teste',
          },
          {
            name: 'trial_ends_at',
            type: 'datetime',
            precision: 6,
            isNullable: true,
            comment: 'Data de fim do período de teste',
          },
          {
            name: 'cancelled_at',
            type: 'datetime',
            precision: 6,
            isNullable: true,
            comment: 'Data de cancelamento da assinatura',
          },
          {
            name: 'cancellation_reason',
            type: 'text',
            isNullable: true,
            comment: 'Motivo do cancelamento',
          },
          {
            name: 'auto_renew',
            type: 'boolean',
            default: true,
            comment: 'Indica se a assinatura deve ser renovada automaticamente',
          },
          {
            name: 'is_grace_period',
            type: 'boolean',
            default: false,
            comment: 'Indica se está no período de carência',
          },
          {
            name: 'grace_period_ends_at',
            type: 'datetime',
            precision: 6,
            isNullable: true,
            comment: 'Data de fim do período de carência',
          },
          {
            name: 'last_payment_at',
            type: 'datetime',
            precision: 6,
            isNullable: true,
            comment: 'Data do último pagamento',
          },
          {
            name: 'next_payment_at',
            type: 'datetime',
            precision: 6,
            isNullable: true,
            comment: 'Data do próximo pagamento',
          },
          {
            name: 'payment_attempts',
            type: 'int',
            default: 0,
            comment: 'Número de tentativas de pagamento',
          },
          {
            name: 'usage_data',
            type: 'json',
            isNullable: true,
            comment: 'Dados de uso da assinatura',
          },
          {
            name: 'metadata',
            type: 'json',
            isNullable: true,
            comment: 'Metadados adicionais da assinatura',
          },
        ],
        indices: [
          // Índices para performance
          {
            name: 'idx_pln_user_subscriptions_user_id',
            columnNames: ['user_id'],
          },
          {
            name: 'idx_pln_user_subscriptions_plan_id',
            columnNames: ['plan_id'],
          },
          {
            name: 'idx_pln_user_subscriptions_subscription_id',
            columnNames: ['subscription_id'],
          },
          {
            name: 'idx_pln_user_subscriptions_external_id',
            columnNames: ['external_subscription_id'],
          },
          {
            name: 'idx_pln_user_subscriptions_status',
            columnNames: ['status'],
          },
          {
            name: 'idx_pln_user_subscriptions_payment_status',
            columnNames: ['payment_status'],
          },
          {
            name: 'idx_pln_user_subscriptions_payment_method',
            columnNames: ['payment_method'],
          },
          {
            name: 'idx_pln_user_subscriptions_billing_cycle',
            columnNames: ['billing_cycle'],
          },
          {
            name: 'idx_pln_user_subscriptions_starts_at',
            columnNames: ['starts_at'],
          },
          {
            name: 'idx_pln_user_subscriptions_ends_at',
            columnNames: ['ends_at'],
          },
          {
            name: 'idx_pln_user_subscriptions_current_period_end',
            columnNames: ['current_period_end'],
          },
          {
            name: 'idx_pln_user_subscriptions_trial_ends_at',
            columnNames: ['trial_ends_at'],
          },
          {
            name: 'idx_pln_user_subscriptions_cancelled_at',
            columnNames: ['cancelled_at'],
          },
          {
            name: 'idx_pln_user_subscriptions_auto_renew',
            columnNames: ['auto_renew'],
          },
          {
            name: 'idx_pln_user_subscriptions_next_payment_at',
            columnNames: ['next_payment_at'],
          },
          
          // Índices compostos
          {
            name: 'idx_pln_user_subscriptions_user_status',
            columnNames: ['user_id', 'status'],
          },
          {
            name: 'idx_pln_user_subscriptions_user_active',
            columnNames: ['user_id', 'status', 'current_period_end'],
          },
          {
            name: 'idx_pln_user_subscriptions_plan_status',
            columnNames: ['plan_id', 'status'],
          },
          {
            name: 'idx_pln_user_subscriptions_active_renewals',
            columnNames: ['status', 'auto_renew', 'next_payment_at'],
          },
        ],
      }),
      true, // ifNotExists
    );

    // Criar foreign keys
    await queryRunner.createForeignKey(
      'pln_user_subscriptions',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'usr_users',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        name: 'fk_pln_user_subscriptions_user_id',
      }),
    );

    await queryRunner.createForeignKey(
      'pln_user_subscriptions',
      new TableForeignKey({
        columnNames: ['plan_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'pln_plans',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
        name: 'fk_pln_user_subscriptions_plan_id',
      }),
    );

    console.log('✅ Tabela pln_user_subscriptions criada com sucesso');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover foreign keys primeiro
    await queryRunner.dropForeignKey('pln_user_subscriptions', 'fk_pln_user_subscriptions_plan_id');
    await queryRunner.dropForeignKey('pln_user_subscriptions', 'fk_pln_user_subscriptions_user_id');
    
    // Remover tabela
    await queryRunner.dropTable('pln_user_subscriptions');
    
    console.log('✅ Tabela pln_user_subscriptions removida com sucesso');
  }
}
