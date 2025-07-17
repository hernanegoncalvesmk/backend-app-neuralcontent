import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreatePaymentsTable1705153000000 implements MigrationInterface {
  name = 'CreatePaymentsTable1705153000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'pay_payments',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
            comment: 'ID único do pagamento',
          },
          {
            name: 'user_id',
            type: 'int',
            comment: 'ID do usuário que realizou o pagamento',
          },
          {
            name: 'plan_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
            comment: 'ID do plano adquirido',
          },
          {
            name: 'amount',
            type: 'int',
            unsigned: true,
            comment: 'Valor do pagamento em centavos',
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
            default: "'BRL'",
            comment: 'Moeda do pagamento',
          },
          {
            name: 'status',
            type: 'enum',
            enum: [
              'pending',
              'completed',
              'failed',
              'cancelled',
              'refunded',
              'processing',
            ],
            default: "'pending'",
            comment: 'Status do pagamento',
          },
          {
            name: 'payment_method',
            type: 'enum',
            enum: ['stripe', 'paypal', 'credit_card', 'pix', 'bank_transfer'],
            comment: 'Método de pagamento utilizado',
          },
          {
            name: 'payment_type',
            type: 'enum',
            enum: ['subscription', 'one_time', 'credits', 'upgrade', 'renewal'],
            comment: 'Tipo do pagamento',
          },
          {
            name: 'external_payment_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'ID do pagamento no provedor externo',
          },
          {
            name: 'external_customer_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'ID do cliente no provedor externo',
          },
          {
            name: 'payment_intent_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'ID do payment intent (Stripe)',
          },
          {
            name: 'invoice_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'ID da invoice relacionada',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
            comment: 'Descrição do pagamento',
          },
          {
            name: 'payment_date',
            type: 'timestamp',
            isNullable: true,
            comment: 'Data efetiva do pagamento',
          },
          {
            name: 'refunded_at',
            type: 'timestamp',
            isNullable: true,
            comment: 'Data do reembolso',
          },
          {
            name: 'refund_amount',
            type: 'int',
            isNullable: true,
            comment: 'Valor reembolsado em centavos',
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
            name: 'metadata',
            type: 'json',
            isNullable: true,
            comment: 'Metadados adicionais do pagamento',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            comment: 'Data de criação',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            comment: 'Data da última atualização',
          },
        ],
      }),
      true,
    );

    // Criar índices
    await queryRunner.createIndex(
      'pay_payments',
      new TableIndex({
        name: 'IDX_payments_status',
        columnNames: ['status'],
      }),
    );
    await queryRunner.createIndex(
      'pay_payments',
      new TableIndex({
        name: 'IDX_payments_payment_method',
        columnNames: ['payment_method'],
      }),
    );
    await queryRunner.createIndex(
      'pay_payments',
      new TableIndex({
        name: 'IDX_payments_user_id',
        columnNames: ['user_id'],
      }),
    );
    await queryRunner.createIndex(
      'pay_payments',
      new TableIndex({
        name: 'IDX_payments_plan_id',
        columnNames: ['plan_id'],
      }),
    );
    await queryRunner.createIndex(
      'pay_payments',
      new TableIndex({
        name: 'IDX_payments_external_payment_id',
        columnNames: ['external_payment_id'],
      }),
    );
    await queryRunner.createIndex(
      'pay_payments',
      new TableIndex({
        name: 'IDX_payments_created_at',
        columnNames: ['created_at'],
      }),
    );

    // Criar foreign keys
    await queryRunner.createForeignKey(
      'pay_payments',
      new TableForeignKey({
        name: 'FK_payments_user_id',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'pay_payments',
      new TableForeignKey({
        name: 'FK_payments_plan_id',
        columnNames: ['plan_id'],
        referencedTableName: 'pln_plans',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('pay_payments', 'FK_payments_user_id');
    await queryRunner.dropForeignKey('pay_payments', 'FK_payments_plan_id');
    await queryRunner.dropTable('pay_payments');
  }
}
