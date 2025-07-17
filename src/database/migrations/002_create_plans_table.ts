import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreatePlansTable1705152500000 implements MigrationInterface {
  name = 'CreatePlansTable1705152500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'pln_plans',
        columns: [
          {
            name: 'id',
            type: 'char',
            length: '36',
            isPrimary: true,
            default: '(UUID())',
            comment: 'Identificador único UUID',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            comment: 'Nome do plano',
          },
          {
            name: 'slug',
            type: 'varchar',
            length: '100',
            isUnique: true,
            comment: 'Identificador único em formato slug',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
            comment: 'Descrição detalhada do plano',
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['free', 'basic', 'premium', 'enterprise'],
            default: "'free'",
            comment: 'Tipo do plano',
          },
          {
            name: 'billing_cycle',
            type: 'enum',
            enum: [
              'daily',
              'weekly',
              'monthly',
              'quarterly',
              'yearly',
              'lifetime',
            ],
            default: "'monthly'",
            comment: 'Ciclo de cobrança do plano',
          },
          {
            name: 'price',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
            comment: 'Preço do plano em centavos',
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
            default: "'BRL'",
            comment: 'Moeda do plano (ISO 4217)',
          },
          {
            name: 'credits_included',
            type: 'int',
            default: 0,
            comment: 'Créditos inclusos no plano',
          },
          {
            name: 'max_projects',
            type: 'int',
            isNullable: true,
            comment: 'Número máximo de projetos (NULL = ilimitado)',
          },
          {
            name: 'max_storage_gb',
            type: 'decimal',
            precision: 8,
            scale: 2,
            isNullable: true,
            comment: 'Armazenamento máximo em GB (NULL = ilimitado)',
          },
          {
            name: 'max_team_members',
            type: 'int',
            isNullable: true,
            comment: 'Máximo de membros da equipe (NULL = ilimitado)',
          },
          {
            name: 'features',
            type: 'json',
            isNullable: true,
            comment: 'Features incluídas no plano em JSON',
          },
          {
            name: 'limits',
            type: 'json',
            isNullable: true,
            comment: 'Limites específicos do plano em JSON',
          },
          {
            name: 'stripe_price_id',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'ID do preço no Stripe',
          },
          {
            name: 'stripe_product_id',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'ID do produto no Stripe',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            comment: 'Indica se o plano está ativo para novas assinaturas',
          },
          {
            name: 'is_featured',
            type: 'boolean',
            default: false,
            comment: 'Indica se o plano é destacado',
          },
          {
            name: 'trial_days',
            type: 'int',
            default: 0,
            comment: 'Dias de trial gratuito',
          },
          {
            name: 'sort_order',
            type: 'int',
            default: 0,
            comment: 'Ordem de exibição do plano',
          },
          {
            name: 'metadata',
            type: 'json',
            isNullable: true,
            comment: 'Metadados adicionais em JSON',
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
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
            comment: 'Data de exclusão lógica',
          },
        ],
        indices: [
          new TableIndex({
            name: 'idx_slug',
            columnNames: ['slug'],
          }),
          new TableIndex({
            name: 'idx_type',
            columnNames: ['type'],
          }),
          new TableIndex({
            name: 'idx_active',
            columnNames: ['is_active'],
          }),
          new TableIndex({
            name: 'idx_featured',
            columnNames: ['is_featured'],
          }),
          new TableIndex({
            name: 'idx_sort_order',
            columnNames: ['sort_order'],
          }),
          new TableIndex({
            name: 'idx_price',
            columnNames: ['price'],
          }),
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('pln_plans');
  }
}
