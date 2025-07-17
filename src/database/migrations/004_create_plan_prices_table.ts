import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreatePlanPricesTable1705152700000 implements MigrationInterface {
  name = 'CreatePlanPricesTable1705152700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'pln_plan_prices',
        columns: [
          {
            name: 'id',
            type: 'char',
            length: '36',
            isPrimary: true,
            default: '(UUID())',
            comment: 'Identificador único do preço',
          },
          {
            name: 'plan_id',
            type: 'char',
            length: '36',
            comment: 'ID do plano',
          },
          {
            name: 'currency',
            type: 'char',
            length: '3',
            default: "'BRL'",
            comment: 'Moeda do preço',
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            comment: 'Valor do preço',
          },
          {
            name: 'interval_type',
            type: 'enum',
            enum: ['month', 'year'],
            default: "'month'",
            comment: 'Tipo de intervalo de cobrança',
          },
          {
            name: 'interval_count',
            type: 'int',
            default: 1,
            comment: 'Quantidade de intervalos',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            comment: 'Se o preço está ativo',
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
            name: 'idx_plan_id',
            columnNames: ['plan_id'],
          }),
          new TableIndex({
            name: 'idx_currency',
            columnNames: ['currency'],
          }),
          new TableIndex({
            name: 'idx_active',
            columnNames: ['is_active'],
          }),
        ],
        uniques: [
          {
            name: 'uk_plan_currency_interval',
            columnNames: ['plan_id', 'currency', 'interval_type'],
          },
        ],
      }),
      true,
    );

    // Criar foreign key para pln_plans
    await queryRunner.createForeignKey(
      'pln_plan_prices',
      new TableForeignKey({
        columnNames: ['plan_id'],
        referencedTableName: 'pln_plans',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_pln_plan_prices_plan_id',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey(
      'pln_plan_prices',
      'FK_pln_plan_prices_plan_id',
    );
    await queryRunner.dropTable('pln_plan_prices');
  }
}
