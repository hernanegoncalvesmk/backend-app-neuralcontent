import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

/**
 * Migration: CreateCreditTransactionsTable
 * 
 * Cria a tabela de transações de crédito para:
 * - Sistema de créditos/moedas virtuais
 * - Controle de saldo de usuários
 * - Auditoria de transações
 * - Histórico completo de movimentações
 * 
 * @author Arquiteto de S    // Remover foreign keys primeiro
    await queryRunner.dropForeignKey('crd_credit_transactions', 'fk_crd_credit_transactions_admin_user_id');
    await queryRunner.dropForeignKey('crd_credit_transactions', 'fk_crd_credit_transactions_payment_id');
    await queryRunner.dropForeignKey('crd_credit_transactions', 'fk_crd_credit_transactions_user_id');as Senior
 * @version 1.0.0
 * @date 2024-01-07
 */
export class CreateCreditTransactionsTable1704006000000 implements MigrationInterface {
  name = 'CreateCreditTransactionsTable1704006000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela crd_credit_transactions
    await queryRunner.createTable(
      new Table({
        name: 'crd_credit_transactions',
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

          // Campos específicos da transação de crédito
          {
            name: 'user_id',
            type: 'int',
            comment: 'ID do usuário da transação',
          },
          {
            name: 'transaction_id',
            type: 'varchar',
            length: '255',
            isUnique: true,
            comment: 'ID único da transação (gerado pelo sistema)',
          },
          {
            name: 'related_payment_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
            comment: 'ID do pagamento relacionado (se aplicável)',
          },
          {
            name: 'related_subscription_id',
            type: 'bigint',
            isNullable: true,
            comment: 'ID da assinatura relacionada (se aplicável)',
          },
          {
            name: 'transaction_type',
            type: 'enum',
            enum: ['purchase', 'consumption', 'bonus', 'refund', 'expiration', 'transfer', 'adjustment'],
            comment: 'Tipo de transação',
          },
          {
            name: 'service_type',
            type: 'enum',
            enum: ['content_generation', 'text_translation', 'image_generation', 'audio_generation', 'video_generation', 'ocr_processing', 'document_analysis', 'api_usage', 'premium_feature'],
            isNullable: true,
            comment: 'Tipo de serviço que consumiu os créditos',
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            comment: 'Valor da transação (positivo para crédito, negativo para débito)',
          },
          {
            name: 'balance_before',
            type: 'decimal',
            precision: 15,
            scale: 2,
            comment: 'Saldo antes da transação',
          },
          {
            name: 'balance_after',
            type: 'decimal',
            precision: 15,
            scale: 2,
            comment: 'Saldo após a transação',
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '10',
            default: "'CREDITS'",
            comment: 'Tipo de moeda/crédito',
          },
          {
            name: 'exchange_rate',
            type: 'decimal',
            precision: 10,
            scale: 4,
            isNullable: true,
            comment: 'Taxa de câmbio (se aplicável)',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'completed', 'failed', 'cancelled', 'expired', 'refunded'],
            default: "'completed'",
            comment: 'Status da transação',
          },
          {
            name: 'description',
            type: 'text',
            comment: 'Descrição detalhada da transação',
          },
          {
            name: 'reference_type',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'Tipo de referência (order, subscription, etc.)',
          },
          {
            name: 'reference_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'ID da referência externa',
          },
          {
            name: 'expires_at',
            type: 'datetime',
            precision: 6,
            isNullable: true,
            comment: 'Data de expiração dos créditos (se aplicável)',
          },
          {
            name: 'processed_at',
            type: 'datetime',
            precision: 6,
            isNullable: true,
            comment: 'Data de processamento da transação',
          },
          {
            name: 'failed_at',
            type: 'datetime',
            precision: 6,
            isNullable: true,
            comment: 'Data de falha da transação',
          },
          {
            name: 'cancelled_at',
            type: 'datetime',
            precision: 6,
            isNullable: true,
            comment: 'Data de cancelamento da transação',
          },
          {
            name: 'refunded_at',
            type: 'datetime',
            precision: 6,
            isNullable: true,
            comment: 'Data de reembolso da transação',
          },
          {
            name: 'failure_reason',
            type: 'text',
            isNullable: true,
            comment: 'Motivo da falha na transação',
          },
          {
            name: 'admin_user_id',
            type: 'int',
            isNullable: true,
            comment: 'ID do administrador que executou a transação (se aplicável)',
          },
          {
            name: 'admin_notes',
            type: 'text',
            isNullable: true,
            comment: 'Observações administrativas',
          },
          {
            name: 'is_reversible',
            type: 'boolean',
            default: true,
            comment: 'Indica se a transação pode ser revertida',
          },
          {
            name: 'is_internal',
            type: 'boolean',
            default: false,
            comment: 'Indica se é uma transação interna do sistema',
          },
          {
            name: 'batch_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'ID do lote (para transações em lote)',
          },
          {
            name: 'source_info',
            type: 'json',
            isNullable: true,
            comment: 'Informações sobre a origem da transação',
          },
          {
            name: 'metadata',
            type: 'json',
            isNullable: true,
            comment: 'Metadados adicionais da transação',
          },
        ],
        indices: [
          // Índices para performance
          {
            name: 'idx_crd_credit_transactions_user_id',
            columnNames: ['user_id'],
          },
          {
            name: 'idx_crd_credit_transactions_transaction_id',
            columnNames: ['transaction_id'],
          },
          {
            name: 'idx_crd_credit_transactions_payment_id',
            columnNames: ['related_payment_id'],
          },
          {
            name: 'idx_crd_credit_transactions_subscription_id',
            columnNames: ['related_subscription_id'],
          },
          {
            name: 'idx_crd_credit_transactions_transaction_type',
            columnNames: ['transaction_type'],
          },
          {
            name: 'idx_crd_credit_transactions_status',
            columnNames: ['status'],
          },
          {
            name: 'idx_crd_credit_transactions_currency',
            columnNames: ['currency'],
          },
          {
            name: 'idx_crd_credit_transactions_reference_type',
            columnNames: ['reference_type'],
          },
          {
            name: 'idx_crd_credit_transactions_reference_id',
            columnNames: ['reference_id'],
          },
          {
            name: 'idx_crd_credit_transactions_expires_at',
            columnNames: ['expires_at'],
          },
          {
            name: 'idx_crd_credit_transactions_processed_at',
            columnNames: ['processed_at'],
          },
          {
            name: 'idx_crd_credit_transactions_admin_user_id',
            columnNames: ['admin_user_id'],
          },
          {
            name: 'idx_crd_credit_transactions_batch_id',
            columnNames: ['batch_id'],
          },
          {
            name: 'idx_crd_credit_transactions_is_reversible',
            columnNames: ['is_reversible'],
          },
          {
            name: 'idx_crd_credit_transactions_is_internal',
            columnNames: ['is_internal'],
          },
          
          // Índices compostos
          {
            name: 'idx_crd_credit_transactions_user_status',
            columnNames: ['user_id', 'status'],
          },
          {
            name: 'idx_crd_credit_transactions_user_type',
            columnNames: ['user_id', 'transaction_type'],
          },
          {
            name: 'idx_crd_credit_transactions_user_date',
            columnNames: ['user_id', 'created_at'],
          },
          {
            name: 'idx_crd_credit_transactions_type_status',
            columnNames: ['transaction_type', 'status'],
          },
          {
            name: 'idx_crd_credit_transactions_reference_lookup',
            columnNames: ['reference_type', 'reference_id'],
          },
          {
            name: 'idx_crd_credit_transactions_balance_tracking',
            columnNames: ['user_id', 'processed_at', 'balance_after'],
          },
        ],
      }),
      true, // ifNotExists
    );

    // Criar foreign keys
    await queryRunner.createForeignKey(
      'crd_credit_transactions',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'usr_users',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        name: 'fk_crd_credit_transactions_user_id',
      }),
    );

    await queryRunner.createForeignKey(
      'crd_credit_transactions',
      new TableForeignKey({
        columnNames: ['related_payment_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'pay_payments',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        name: 'fk_crd_credit_transactions_payment_id',
      }),
    );

    await queryRunner.createForeignKey(
      'crd_credit_transactions',
      new TableForeignKey({
        columnNames: ['admin_user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'usr_users',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        name: 'fk_crd_credit_transactions_admin_user_id',
      }),
    );

    console.log('✅ Tabela crd_credit_transactions criada com sucesso');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover foreign keys primeiro
    await queryRunner.dropForeignKey('crd_credit_transactions', 'fk_crd_credit_transactions_admin_user_id');
    await queryRunner.dropForeignKey('crd_credit_transactions', 'fk_crd_credit_transactions_subscription_id');
    await queryRunner.dropForeignKey('crd_credit_transactions', 'fk_crd_credit_transactions_payment_id');
    await queryRunner.dropForeignKey('crd_credit_transactions', 'fk_crd_credit_transactions_user_id');
    
    // Remover tabela
    await queryRunner.dropTable('crd_credit_transactions');
    
    console.log('✅ Tabela crd_credit_transactions removida com sucesso');
  }
}
