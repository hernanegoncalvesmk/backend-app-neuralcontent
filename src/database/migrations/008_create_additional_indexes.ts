import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class CreateAdditionalIndexes1705153100000
  implements MigrationInterface
{
  name = 'CreateAdditionalIndexes1705153100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Índices compostos para melhor performance

    // Users - índices compostos para consultas comuns
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_users_status_email_verified',
        columnNames: ['status', 'isEmailVerified'],
      }),
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_users_role_status',
        columnNames: ['role', 'status'],
      }),
    );

    // User sessions - índices para limpeza de sessões expiradas
    await queryRunner.createIndex(
      'user_sessions',
      new TableIndex({
        name: 'IDX_user_sessions_expires_active',
        columnNames: ['expiresAt', 'isActive'],
      }),
    );

    // Credit transactions - índices para relatórios
    await queryRunner.createIndex(
      'credit_transactions',
      new TableIndex({
        name: 'IDX_credit_user_type_created',
        columnNames: ['user_id', 'type', 'created_at'],
      }),
    );

    // Payments - índices para relatórios financeiros
    await queryRunner.createIndex(
      'pay_payments',
      new TableIndex({
        name: 'IDX_payments_status_created',
        columnNames: ['status', 'created_at'],
      }),
    );

    await queryRunner.createIndex(
      'pay_payments',
      new TableIndex({
        name: 'IDX_payments_user_status',
        columnNames: ['user_id', 'status'],
      }),
    );

    // User subscriptions - índices para gestão de subscriptions
    await queryRunner.createIndex(
      'pay_user_subscriptions',
      new TableIndex({
        name: 'IDX_subscriptions_status_billing',
        columnNames: ['status', 'next_billing_date'],
      }),
    );

    await queryRunner.createIndex(
      'pay_user_subscriptions',
      new TableIndex({
        name: 'IDX_subscriptions_user_status',
        columnNames: ['user_id', 'status'],
      }),
    );

    // Plan features - índice para consultas de features por plano
    await queryRunner.createIndex(
      'pln_plan_features',
      new TableIndex({
        name: 'IDX_plan_features_plan_enabled_order',
        columnNames: ['plan_id', 'is_enabled', 'sort_order'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices compostos
    await queryRunner.dropIndex('users', 'IDX_users_status_email_verified');
    await queryRunner.dropIndex('users', 'IDX_users_role_status');
    await queryRunner.dropIndex(
      'user_sessions',
      'IDX_user_sessions_expires_active',
    );
    await queryRunner.dropIndex(
      'credit_transactions',
      'IDX_credit_user_type_created',
    );
    await queryRunner.dropIndex('pay_payments', 'IDX_payments_status_created');
    await queryRunner.dropIndex('pay_payments', 'IDX_payments_user_status');
    await queryRunner.dropIndex(
      'pay_user_subscriptions',
      'IDX_subscriptions_status_billing',
    );
    await queryRunner.dropIndex(
      'pay_user_subscriptions',
      'IDX_subscriptions_user_status',
    );
    await queryRunner.dropIndex(
      'pln_plan_features',
      'IDX_plan_features_plan_enabled_order',
    );
  }
}
