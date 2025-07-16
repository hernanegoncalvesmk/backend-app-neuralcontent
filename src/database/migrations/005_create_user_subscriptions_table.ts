import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateUserSubscriptionsTable1705152700000 implements MigrationInterface {
  name = 'CreateUserSubscriptionsTable1705152700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'pln_user_subscriptions',
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
            name: 'user_id',
            type: 'char',
            length: '36',
            comment: 'Referência ao usuário (usr_users.id)',
          },
          {
            name: 'plan_id',
            type: 'char',
            length: '36',
            comment: 'Referência ao plano (pln_plans.id)',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['trial', 'active', 'cancelled', 'expired', 'suspended', 'pending'],
            default: "'pending'",
            comment: 'Status da assinatura',
          },
          {
            name: 'stripe_subscription_id',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'ID da assinatura no Stripe',
          },
          {
            name: 'stripe_customer_id',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'ID do cliente no Stripe',
          },
          {
            name: 'payment_method',
            type: 'enum',
            enum: ['stripe', 'paypal', 'pix', 'boleto', 'credit_card', 'bank_transfer'],
            isNullable: true,
            comment: 'Método de pagamento utilizado',
          },
          {
            name: 'trial_start_date',
            type: 'timestamp',
            isNullable: true,
            comment: 'Data de início do período de trial',
          },
          {
            name: 'trial_end_date',
            type: 'timestamp',
            isNullable: true,
            comment: 'Data de fim do período de trial',
          },
          {
            name: 'start_date',
            type: 'timestamp',
            comment: 'Data de início da assinatura',
          },
          {
            name: 'end_date',
            type: 'timestamp',
            isNullable: true,
            comment: 'Data de fim da assinatura',
          },
          {
            name: 'next_billing_date',
            type: 'timestamp',
            isNullable: true,
            comment: 'Próxima data de cobrança',
          },
          {
            name: 'cancelled_at',
            type: 'timestamp',
            isNullable: true,
            comment: 'Data de cancelamento',
          },
          {
            name: 'cancelled_reason',
            type: 'text',
            isNullable: true,
            comment: 'Motivo do cancelamento',
          },
          {
            name: 'auto_renew',
            type: 'boolean',
            default: true,
            comment: 'Renovação automática habilitada',
          },
          {
            name: 'current_period_start',
            type: 'timestamp',
            isNullable: true,
            comment: 'Início do período atual de cobrança',
          },
          {
            name: 'current_period_end',
            type: 'timestamp',
            isNullable: true,
            comment: 'Fim do período atual de cobrança',
          },
          {
            name: 'price_paid',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
            comment: 'Preço pago pela assinatura',
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
            default: "'BRL'",
            comment: 'Moeda da assinatura (ISO 4217)',
          },
          {
            name: 'credits_granted',
            type: 'int',
            default: 0,
            comment: 'Créditos concedidos com esta assinatura',
          },
          {
            name: 'credits_used',
            type: 'int',
            default: 0,
            comment: 'Créditos utilizados nesta assinatura',
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
            name: 'idx_user_id',
            columnNames: ['user_id'],
          }),
          new TableIndex({
            name: 'idx_plan_id',
            columnNames: ['plan_id'],
          }),
          new TableIndex({
            name: 'idx_status',
            columnNames: ['status'],
          }),
          new TableIndex({
            name: 'idx_stripe_subscription',
            columnNames: ['stripe_subscription_id'],
          }),
          new TableIndex({
            name: 'idx_next_billing',
            columnNames: ['next_billing_date'],
          }),
          new TableIndex({
            name: 'idx_end_date',
            columnNames: ['end_date'],
          }),
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['user_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'usr_users',
            onDelete: 'CASCADE',
            name: 'fk_subscription_user',
          }),
          new TableForeignKey({
            columnNames: ['plan_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'pln_plans',
            onDelete: 'RESTRICT',
            name: 'fk_subscription_plan',
          }),
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('pln_user_subscriptions');
  }
}
