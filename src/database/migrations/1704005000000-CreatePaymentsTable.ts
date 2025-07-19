import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

/**
 * Migration: CreatePaymentsTable
 * 
 * Cria a tabela de pagamentos para:
 * - Gestão completa de transações
 * - Integração com gateways de pagamento
 * - Auditoria financeira
 * - Controle de estornos e reembolsos
 * 
 * @author Arquiteto de Sistemas Senior
 * @version 1.0.0
 * @date 2024-01-06
 */
export class CreatePaymentsTable1704005000000 implements MigrationInterface {
  name = 'CreatePaymentsTable1704005000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela pay_payments
    await queryRunner.createTable(
      new Table({
        name: 'pay_payments',
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

          // Campos específicos do pagamento
          {
            name: 'user_id',
            type: 'int',
            comment: 'ID do usuário que fez o pagamento',
          },
          {
            name: 'plan_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
            comment: 'ID do plano relacionado (se aplicável)',
          },
          {
            name: 'payment_id',
            type: 'varchar',
            length: '255',
            isUnique: true,
            comment: 'ID único do pagamento (gerado pelo sistema)',
          },
          {
            name: 'external_payment_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'ID do pagamento no gateway externo',
          },
          {
            name: 'gateway_provider',
            type: 'enum',
            enum: ['stripe', 'paypal', 'pix', 'boleto', 'mercadopago', 'pagseguro', 'manual'],
            comment: 'Provedor do gateway de pagamento',
          },
          {
            name: 'payment_method',
            type: 'enum',
            enum: ['credit_card', 'debit_card', 'pix', 'boleto', 'paypal', 'bank_transfer', 'cash', 'crypto'],
            comment: 'Método de pagamento utilizado',
          },
          {
            name: 'payment_type',
            type: 'enum',
            enum: ['subscription', 'one_time', 'refund', 'chargeback', 'fee', 'bonus'],
            comment: 'Tipo de pagamento',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'disputed'],
            comment: 'Status atual do pagamento',
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            comment: 'Valor do pagamento em centavos',
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
            default: "'BRL'",
            comment: 'Moeda do pagamento (ISO 4217)',
          },
          {
            name: 'fees',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
            comment: 'Taxas cobradas em centavos',
          },
          {
            name: 'net_amount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            comment: 'Valor líquido após taxas em centavos',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
            comment: 'Descrição do pagamento',
          },
          {
            name: 'invoice_number',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'Número da fatura/nota fiscal',
          },
          {
            name: 'reference_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'ID de referência externa',
          },
          {
            name: 'authorization_code',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'Código de autorização da transação',
          },
          {
            name: 'transaction_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'ID da transação no gateway',
          },
          {
            name: 'payment_date',
            type: 'datetime',
            precision: 6,
            isNullable: true,
            comment: 'Data efetiva do pagamento',
          },
          {
            name: 'due_date',
            type: 'datetime',
            precision: 6,
            isNullable: true,
            comment: 'Data de vencimento (para boletos)',
          },
          {
            name: 'processed_at',
            type: 'datetime',
            precision: 6,
            isNullable: true,
            comment: 'Data de processamento do pagamento',
          },
          {
            name: 'failed_at',
            type: 'datetime',
            precision: 6,
            isNullable: true,
            comment: 'Data de falha do pagamento',
          },
          {
            name: 'refunded_at',
            type: 'datetime',
            precision: 6,
            isNullable: true,
            comment: 'Data do reembolso',
          },
          {
            name: 'refund_amount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
            comment: 'Valor do reembolso em centavos',
          },
          {
            name: 'refund_reason',
            type: 'text',
            isNullable: true,
            comment: 'Motivo do reembolso',
          },
          {
            name: 'failure_reason',
            type: 'text',
            isNullable: true,
            comment: 'Motivo da falha no pagamento',
          },
          {
            name: 'customer_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Nome do cliente na transação',
          },
          {
            name: 'customer_email',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Email do cliente na transação',
          },
          {
            name: 'customer_phone',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'Telefone do cliente na transação',
          },
          {
            name: 'customer_document',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'Documento do cliente (CPF/CNPJ)',
          },
          {
            name: 'billing_address',
            type: 'json',
            isNullable: true,
            comment: 'Endereço de cobrança',
          },
          {
            name: 'payment_details',
            type: 'json',
            isNullable: true,
            comment: 'Detalhes específicos do método de pagamento',
          },
          {
            name: 'gateway_response',
            type: 'json',
            isNullable: true,
            comment: 'Resposta completa do gateway',
          },
          {
            name: 'webhook_events',
            type: 'json',
            isNullable: true,
            comment: 'Eventos de webhook recebidos',
          },
          {
            name: 'attempts',
            type: 'int',
            default: 1,
            comment: 'Número de tentativas de pagamento',
          },
          {
            name: 'is_test',
            type: 'boolean',
            default: false,
            comment: 'Indica se é um pagamento de teste',
          },
          {
            name: 'metadata',
            type: 'json',
            isNullable: true,
            comment: 'Metadados adicionais do pagamento',
          },
        ],
        indices: [
          // Índices para performance
          {
            name: 'idx_pay_payments_user_id',
            columnNames: ['user_id'],
          },
          {
            name: 'idx_pay_payments_payment_id',
            columnNames: ['payment_id'],
          },
          {
            name: 'idx_pay_payments_external_payment_id',
            columnNames: ['external_payment_id'],
          },
          {
            name: 'idx_pay_payments_gateway_provider',
            columnNames: ['gateway_provider'],
          },
          {
            name: 'idx_pay_payments_payment_method',
            columnNames: ['payment_method'],
          },
          {
            name: 'idx_pay_payments_payment_type',
            columnNames: ['payment_type'],
          },
          {
            name: 'idx_pay_payments_status',
            columnNames: ['status'],
          },
          {
            name: 'idx_pay_payments_currency',
            columnNames: ['currency'],
          },
          {
            name: 'idx_pay_payments_payment_date',
            columnNames: ['payment_date'],
          },
          {
            name: 'idx_pay_payments_due_date',
            columnNames: ['due_date'],
          },
          {
            name: 'idx_pay_payments_processed_at',
            columnNames: ['processed_at'],
          },
          {
            name: 'idx_pay_payments_reference_id',
            columnNames: ['reference_id'],
          },
          {
            name: 'idx_pay_payments_transaction_id',
            columnNames: ['transaction_id'],
          },
          {
            name: 'idx_pay_payments_invoice_number',
            columnNames: ['invoice_number'],
          },
          {
            name: 'idx_pay_payments_is_test',
            columnNames: ['is_test'],
          },
          
          // Índices compostos
          {
            name: 'idx_pay_payments_user_status',
            columnNames: ['user_id', 'status'],
          },
          {
            name: 'idx_pay_payments_user_date',
            columnNames: ['user_id', 'payment_date'],
          },
          {
            name: 'idx_pay_payments_gateway_status',
            columnNames: ['gateway_provider', 'status'],
          },
          {
            name: 'idx_pay_payments_status_date',
            columnNames: ['status', 'payment_date'],
          },
          {
            name: 'idx_pay_payments_type_status',
            columnNames: ['payment_type', 'status'],
          },
        ],
      }),
      true, // ifNotExists
    );

    // Criar foreign keys
    await queryRunner.createForeignKey(
      'pay_payments',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'usr_users',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        name: 'fk_pay_payments_user_id',
      }),
    );

    console.log('✅ Tabela pay_payments criada com sucesso');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover foreign keys primeiro
    await queryRunner.dropForeignKey('pay_payments', 'fk_pay_payments_user_id');
    
    // Remover tabela
    await queryRunner.dropTable('pay_payments');
    
    console.log('✅ Tabela pay_payments removida com sucesso');
  }
}
