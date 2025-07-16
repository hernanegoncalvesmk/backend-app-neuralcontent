import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateCreditTransactionsTable1705152900000 implements MigrationInterface {
  name = 'CreateCreditTransactionsTable1705152900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'credit_transactions',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
            comment: 'ID único da transação de crédito',
          },
          {
            name: 'user_id',
            type: 'int',
            comment: 'ID do usuário',
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['credit', 'debit', 'bonus', 'refund', 'purchase', 'subscription'],
            comment: 'Tipo da transação de crédito',
          },
          {
            name: 'amount',
            type: 'int',
            comment: 'Quantidade de créditos (positiva ou negativa)',
          },
          {
            name: 'balance_before',
            type: 'int',
            comment: 'Saldo antes da transação',
          },
          {
            name: 'balance_after',
            type: 'int',
            comment: 'Saldo após a transação',
          },
          {
            name: 'description',
            type: 'varchar',
            length: '255',
            comment: 'Descrição da transação',
          },
          {
            name: 'reference_type',
            type: 'enum',
            enum: ['payment', 'subscription', 'bonus', 'admin', 'api_usage', 'refund'],
            isNullable: true,
            comment: 'Tipo de referência da transação',
          },
          {
            name: 'reference_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
            comment: 'ID de referência (pagamento, subscription, etc)',
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: true,
            comment: 'Data de expiração dos créditos (se aplicável)',
          },
          {
            name: 'metadata',
            type: 'json',
            isNullable: true,
            comment: 'Metadados adicionais da transação',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            comment: 'Data de criação da transação',
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
      'credit_transactions',
      new TableIndex({
        name: 'IDX_credit_transactions_user_id',
        columnNames: ['user_id'],
      }),
    );
    await queryRunner.createIndex(
      'credit_transactions',
      new TableIndex({
        name: 'IDX_credit_transactions_type',
        columnNames: ['type'],
      }),
    );
    await queryRunner.createIndex(
      'credit_transactions',
      new TableIndex({
        name: 'IDX_credit_transactions_reference',
        columnNames: ['reference_type', 'reference_id'],
      }),
    );
    await queryRunner.createIndex(
      'credit_transactions',
      new TableIndex({
        name: 'IDX_credit_transactions_created_at',
        columnNames: ['created_at'],
      }),
    );
    await queryRunner.createIndex(
      'credit_transactions',
      new TableIndex({
        name: 'IDX_credit_transactions_expires_at',
        columnNames: ['expires_at'],
      }),
    );

    // Criar foreign key
    await queryRunner.createForeignKey(
      'credit_transactions',
      new TableForeignKey({
        name: 'FK_credit_transactions_user_id',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('credit_transactions', 'FK_credit_transactions_user_id');
    await queryRunner.dropTable('credit_transactions');
  }
}
