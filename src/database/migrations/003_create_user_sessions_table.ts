import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateUserSessionsTable1705152600000 implements MigrationInterface {
  name = 'CreateUserSessionsTable1705152600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'usr_sessions',
        columns: [
          {
            name: 'id',
            type: 'char',
            length: '36',
            isPrimary: true,
            default: '(UUID())',
            comment: 'Identificador único da sessão',
          },
          {
            name: 'user_id',
            type: 'char',
            length: '36',
            comment: 'ID do usuário proprietário da sessão',
          },
          {
            name: 'session_token',
            type: 'varchar',
            length: '255',
            isUnique: true,
            comment: 'Token único da sessão',
          },
          {
            name: 'refresh_token',
            type: 'varchar',
            length: '255',
            isUnique: true,
            comment: 'Token de refresh único',
          },
          {
            name: 'ip_address',
            type: 'varchar',
            length: '45',
            isNullable: true,
            comment: 'Endereço IP da sessão',
          },
          {
            name: 'user_agent',
            type: 'text',
            isNullable: true,
            comment: 'User Agent do navegador/dispositivo',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            comment: 'Se a sessão está ativa',
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            comment: 'Data de expiração da sessão',
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
            name: 'idx_session_token',
            columnNames: ['session_token'],
          }),
          new TableIndex({
            name: 'idx_refresh_token',
            columnNames: ['refresh_token'],
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
      'usr_sessions',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'usr_users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_usr_sessions_user_id',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('usr_sessions', 'FK_usr_sessions_user_id');
    await queryRunner.dropTable('usr_sessions');
  }
}
