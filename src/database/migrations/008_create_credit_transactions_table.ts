import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateCreditTransactionsTable1705153100000 implements MigrationInterface {
  name = 'CreateCreditTransactionsTable1705153100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'crd_credit_transactions',
        columns: [
          {
            name: 'id',
            type: 'char',
            length: '36',
            isPrimary: true,
            default: '(UUID())',
            comment: 'Identificador único da transação',
          },
          {
            name: 'user_id',
            type: 'char',
            length: '36',
            comment: 'ID do usuário',
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['grant', 'purchase', 'consume', 'expire', 'refund', 'bonus', 'transfer'],
            comment: 'Tipo da transação de crédito',
          },
          {
            name: 'credit_type',
            type: 'enum',
            enum: ['monthly', 'extra', 'bonus'],
            default: "'monthly'",
            comment: 'Tipo de crédito afetado',
          },
          {
            name: 'amount',
            type: 'bigint',
            comment: 'Quantidade de créditos',
          },
          {
            name: 'balance_after',
            type: 'bigint',
            comment: 'Saldo após a transação',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
            comment: 'Descrição da transação',
          },
          {
            name: 'reference_type',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'Tipo de referência',
          },
          {
            name: 'reference_id',
            type: 'char',
            length: '36',
            isNullable: true,
            comment: 'ID de referência',
          },
          {
            name: 'metadata',
            type: 'json',
            isNullable: true,
            comment: 'Metadados adicionais',
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: true,
            comment: 'Data de expiração dos créditos',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            comment: 'Data de criação do registro',
          },
        ],
        indices: [
          new TableIndex({
            name: 'idx_user_id',
            columnNames: ['user_id'],
          }),
          new TableIndex({
            name: 'idx_type',
            columnNames: ['type'],
          }),
          new TableIndex({
            name: 'idx_credit_type',
            columnNames: ['credit_type'],
          }),
          new TableIndex({
            name: 'idx_reference',
            columnNames: ['reference_type', 'reference_id'],
          }),
          new TableIndex({
            name: 'idx_created',
            columnNames: ['created_at'],
          }),
          new TableIndex({
            name: 'idx_expires',
            columnNames: ['expires_at'],
          }),
        ],
      }),
      true,
    );

    // Criar foreign key para usr_users
    await queryRunner.createForeignKey(
      'crd_credit_transactions',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'usr_users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_crd_credit_transactions_user_id',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('crd_credit_transactions', 'FK_crd_credit_transactions_user_id');
    await queryRunner.dropTable('crd_credit_transactions');
  }
}
