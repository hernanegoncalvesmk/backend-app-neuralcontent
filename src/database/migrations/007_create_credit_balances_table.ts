import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateCreditBalancesTable1705153000000 implements MigrationInterface {
  name = 'CreateCreditBalancesTable1705153000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'crd_credit_balances',
        columns: [
          {
            name: 'id',
            type: 'char',
            length: '36',
            isPrimary: true,
            default: '(UUID())',
            comment: 'Identificador único do saldo',
          },
          {
            name: 'user_id',
            type: 'char',
            length: '36',
            isUnique: true,
            comment: 'ID único do usuário',
          },
          {
            name: 'monthly_credits',
            type: 'bigint',
            default: 0,
            comment: 'Créditos mensais disponíveis',
          },
          {
            name: 'monthly_used',
            type: 'bigint',
            default: 0,
            comment: 'Créditos mensais utilizados',
          },
          {
            name: 'monthly_reset_at',
            type: 'timestamp',
            comment: 'Data do próximo reset mensal',
          },
          {
            name: 'extra_credits',
            type: 'bigint',
            default: 0,
            comment: 'Créditos extras disponíveis',
          },
          {
            name: 'extra_used',
            type: 'bigint',
            default: 0,
            comment: 'Créditos extras utilizados',
          },
          {
            name: 'total_earned',
            type: 'bigint',
            default: 0,
            comment: 'Total de créditos ganhos',
          },
          {
            name: 'total_consumed',
            type: 'bigint',
            default: 0,
            comment: 'Total de créditos consumidos',
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
            name: 'idx_reset_at',
            columnNames: ['monthly_reset_at'],
          }),
        ],
      }),
      true,
    );

    // Criar foreign key para usr_users
    await queryRunner.createForeignKey(
      'crd_credit_balances',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'usr_users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_crd_credit_balances_user_id',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('crd_credit_balances', 'FK_crd_credit_balances_user_id');
    await queryRunner.dropTable('crd_credit_balances');
  }
}
