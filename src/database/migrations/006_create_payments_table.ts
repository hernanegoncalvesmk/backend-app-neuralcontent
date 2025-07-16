import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreatePaymentsTable1705152900000 implements MigrationInterface {
  name = 'CreatePaymentsTable1705152900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'pay_payments',
        columns: [
          {
            name: 'id',
            type: 'char',
            length: '36',
            isPrimary: true,
            default: '(UUID())',
            comment: 'Identificador único do pagamento',
          },
          {
            name: 'user_id',
            type: 'char',
            length: '36',
            comment: 'ID do usuário que realizou o pagamento',
          },
          {
            name: 'subscription_id',
            type: 'char',
            length: '36',
            isNullable: true,
            comment: 'ID da assinatura relacionada',
          },
          {
            name: 'gateway_transaction_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'ID da transação no gateway',
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            comment: 'Valor do pagamento',
          },
          {
            name: 'currency',
            type: 'char',
            length: '3',
            default: "'BRL'",
            comment: 'Moeda do pagamento',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
            default: "'pending'",
            comment: 'Status do pagamento',
          },
          {
            name: 'payment_method',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'Método de pagamento utilizado',
          },
          {
            name: 'gateway_response',
            type: 'json',
            isNullable: true,
            comment: 'Resposta completa do gateway',
          },
          {
            name: 'metadata',
            type: 'json',
            isNullable: true,
            comment: 'Metadados adicionais',
          },
          {
            name: 'processed_at',
            type: 'timestamp',
            isNullable: true,
            comment: 'Data de processamento',
          },
          {
            name: 'failed_at',
            type: 'timestamp',
            isNullable: true,
            comment: 'Data de falha',
          },
          {
            name: 'refunded_at',
            type: 'timestamp',
            isNullable: true,
            comment: 'Data de reembolso',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            comment: 'Data de criação do registro',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            comment: 'Data da última atualização',
          },
        ],
        indices: [
          new TableIndex({
            name: 'idx_user_id',
            columnNames: ['user_id'],
          }),
          new TableIndex({
            name: 'idx_subscription_id',
            columnNames: ['subscription_id'],
          }),
          new TableIndex({
            name: 'idx_status',
            columnNames: ['status'],
          }),
          new TableIndex({
            name: 'idx_gateway_transaction',
            columnNames: ['gateway_transaction_id'],
          }),
          new TableIndex({
            name: 'idx_created',
            columnNames: ['created_at'],
          }),
        ],
      }),
      true,
    );

    // Criar foreign keys
    await queryRunner.createForeignKey(
      'pay_payments',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'usr_users',
        referencedColumnNames: ['id'],
        name: 'FK_pay_payments_user_id',
      }),
    );

    await queryRunner.createForeignKey(
      'pay_payments',
      new TableForeignKey({
        columnNames: ['subscription_id'],
        referencedTableName: 'pln_user_subscriptions',
        referencedColumnNames: ['id'],
        name: 'FK_pay_payments_subscription_id',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('pay_payments', 'FK_pay_payments_user_id');
    await queryRunner.dropForeignKey('pay_payments', 'FK_pay_payments_subscription_id');
    await queryRunner.dropTable('pay_payments');
  }
}
