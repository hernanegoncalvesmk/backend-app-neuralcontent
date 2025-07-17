import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateUserSessionsTable1705152700000
  implements MigrationInterface
{
  name = 'CreateUserSessionsTable1705152700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user_sessions',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
            comment: 'ID único da sessão',
          },
          {
            name: 'userId',
            type: 'int',
            comment: 'ID do usuário proprietário da sessão',
          },
          {
            name: 'refreshTokenHash',
            type: 'varchar',
            length: '255',
            comment: 'Hash do refresh token para segurança',
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
            comment: 'Data de expiração da sessão',
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
            comment: 'Indica se a sessão está ativa',
          },
          {
            name: 'ipAddress',
            type: 'varchar',
            length: '45',
            isNullable: true,
            comment: 'Endereço IP da sessão',
          },
          {
            name: 'userAgent',
            type: 'text',
            isNullable: true,
            comment: 'User Agent do navegador/dispositivo',
          },
          {
            name: 'location',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'Localização geográfica aproximada',
          },
          {
            name: 'deviceType',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'Tipo de dispositivo utilizado',
          },
          {
            name: 'lastActivityAt',
            type: 'timestamp',
            isNullable: true,
            comment: 'Data da última atividade na sessão',
          },
          {
            name: 'refreshCount',
            type: 'int',
            default: 0,
            comment: 'Contador de tentativas de renovação',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            comment: 'Data de criação da sessão',
          },
          {
            name: 'updatedAt',
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
      'user_sessions',
      new TableIndex({
        name: 'IDX_user_sessions_user_id_active',
        columnNames: ['userId', 'isActive'],
      }),
    );
    await queryRunner.createIndex(
      'user_sessions',
      new TableIndex({
        name: 'IDX_user_sessions_refresh_token',
        columnNames: ['refreshTokenHash'],
      }),
    );
    await queryRunner.createIndex(
      'user_sessions',
      new TableIndex({
        name: 'IDX_user_sessions_expires_at',
        columnNames: ['expiresAt'],
      }),
    );

    // Criar foreign key
    await queryRunner.createForeignKey(
      'user_sessions',
      new TableForeignKey({
        name: 'FK_user_sessions_user_id',
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey(
      'user_sessions',
      'FK_user_sessions_user_id',
    );
    await queryRunner.dropTable('user_sessions');
  }
}
