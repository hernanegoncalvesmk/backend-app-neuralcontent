import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreatePlanFeaturesTable1705152600000 implements MigrationInterface {
  name = 'CreatePlanFeaturesTable1705152600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'pln_plan_features',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
            comment: 'ID único da feature',
          },
          {
            name: 'plan_id',
            type: 'varchar',
            length: '36',
            comment: 'ID do plano relacionado',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            comment: 'Nome da funcionalidade',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
            comment: 'Descrição detalhada da funcionalidade',
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['boolean', 'limit', 'text', 'number'],
            default: "'boolean'",
            comment: 'Tipo da funcionalidade',
          },
          {
            name: 'value',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Valor da funcionalidade',
          },
          {
            name: 'is_enabled',
            type: 'boolean',
            default: true,
            comment: 'Se a funcionalidade está habilitada',
          },
          {
            name: 'sort_order',
            type: 'int',
            default: 0,
            comment: 'Ordem de exibição da funcionalidade',
          },
          {
            name: 'metadata',
            type: 'json',
            isNullable: true,
            comment: 'Metadados adicionais da funcionalidade',
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
      'pln_plan_features',
      new TableIndex({
        name: 'IDX_plan_features_plan_id',
        columnNames: ['plan_id'],
      }),
    );
    await queryRunner.createIndex(
      'pln_plan_features',
      new TableIndex({
        name: 'IDX_plan_features_is_enabled',
        columnNames: ['is_enabled'],
      }),
    );
    await queryRunner.createIndex(
      'pln_plan_features',
      new TableIndex({
        name: 'IDX_plan_features_sort_order',
        columnNames: ['sort_order'],
      }),
    );

    // Criar foreign key
    await queryRunner.createForeignKey(
      'pln_plan_features',
      new TableForeignKey({
        name: 'FK_plan_features_plan_id',
        columnNames: ['plan_id'],
        referencedTableName: 'pln_plans',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('pln_plan_features', 'FK_plan_features_plan_id');
    await queryRunner.dropTable('pln_plan_features');
  }
}
