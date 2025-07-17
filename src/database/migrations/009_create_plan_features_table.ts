import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreatePlanFeaturesTable1705153200000
  implements MigrationInterface
{
  name = 'CreatePlanFeaturesTable1705153200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela de features disponíveis
    await queryRunner.createTable(
      new Table({
        name: 'pln_features',
        columns: [
          {
            name: 'id',
            type: 'char',
            length: '36',
            isPrimary: true,
            default: '(UUID())',
            comment: 'Identificador único da feature',
          },
          {
            name: 'key_name',
            type: 'varchar',
            length: '100',
            isUnique: true,
            comment: 'Chave única da feature',
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
            comment: 'Descrição da funcionalidade',
          },
          {
            name: 'category',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'Categoria da feature',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            comment: 'Se a feature está ativa',
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
            name: 'idx_key_name',
            columnNames: ['key_name'],
          }),
          new TableIndex({
            name: 'idx_category',
            columnNames: ['category'],
          }),
          new TableIndex({
            name: 'idx_active',
            columnNames: ['is_active'],
          }),
        ],
      }),
      true,
    );

    // Criar tabela de relacionamento plano-features
    await queryRunner.createTable(
      new Table({
        name: 'pln_plan_features',
        columns: [
          {
            name: 'id',
            type: 'char',
            length: '36',
            isPrimary: true,
            default: '(UUID())',
            comment: 'Identificador único do relacionamento',
          },
          {
            name: 'plan_id',
            type: 'char',
            length: '36',
            comment: 'ID do plano',
          },
          {
            name: 'feature_id',
            type: 'char',
            length: '36',
            comment: 'ID da feature',
          },
          {
            name: 'limit_value',
            type: 'int',
            isNullable: true,
            comment: 'Valor limite da feature (se aplicável)',
          },
          {
            name: 'is_enabled',
            type: 'boolean',
            default: true,
            comment: 'Se a feature está habilitada no plano',
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
            name: 'idx_plan_id',
            columnNames: ['plan_id'],
          }),
          new TableIndex({
            name: 'idx_feature_id',
            columnNames: ['feature_id'],
          }),
        ],
        uniques: [
          {
            name: 'uk_plan_feature',
            columnNames: ['plan_id', 'feature_id'],
          },
        ],
      }),
      true,
    );

    // Criar foreign keys
    await queryRunner.createForeignKey(
      'pln_plan_features',
      new TableForeignKey({
        columnNames: ['plan_id'],
        referencedTableName: 'pln_plans',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_pln_plan_features_plan_id',
      }),
    );

    await queryRunner.createForeignKey(
      'pln_plan_features',
      new TableForeignKey({
        columnNames: ['feature_id'],
        referencedTableName: 'pln_features',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_pln_plan_features_feature_id',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey(
      'pln_plan_features',
      'FK_pln_plan_features_plan_id',
    );
    await queryRunner.dropForeignKey(
      'pln_plan_features',
      'FK_pln_plan_features_feature_id',
    );
    await queryRunner.dropTable('pln_plan_features');
    await queryRunner.dropTable('pln_features');
  }
}
