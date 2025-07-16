import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateUsersTable1705152400000 implements MigrationInterface {
  name = 'CreateUsersTable1705152400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'usr_users',
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
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
            comment: 'Email único do usuário para login',
          },
          {
            name: 'password',
            type: 'varchar',
            length: '255',
            comment: 'Hash bcrypt da senha do usuário',
          },
          {
            name: 'first_name',
            type: 'varchar',
            length: '100',
            comment: 'Primeiro nome do usuário',
          },
          {
            name: 'last_name',
            type: 'varchar',
            length: '100',
            comment: 'Sobrenome do usuário',
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '20',
            isNullable: true,
            comment: 'Telefone de contato do usuário',
          },
          {
            name: 'avatar_url',
            type: 'text',
            isNullable: true,
            comment: 'URL do avatar/foto do usuário',
          },
          {
            name: 'role',
            type: 'enum',
            enum: ['super-admin', 'admin', 'user', 'guest'],
            default: "'user'",
            comment: 'Papel/função do usuário no sistema',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            comment: 'Indica se o usuário está ativo',
          },
          {
            name: 'is_email_verified',
            type: 'boolean',
            default: false,
            comment: 'Indica se o email foi verificado',
          },
          {
            name: 'is_phone_verified',
            type: 'boolean',
            default: false,
            comment: 'Indica se o telefone foi verificado',
          },
          {
            name: 'email_verified_at',
            type: 'timestamp',
            isNullable: true,
            comment: 'Data de verificação do email',
          },
          {
            name: 'phone_verified_at',
            type: 'timestamp',
            isNullable: true,
            comment: 'Data de verificação do telefone',
          },
          {
            name: 'last_login_at',
            type: 'timestamp',
            isNullable: true,
            comment: 'Data do último login',
          },
          {
            name: 'preferences',
            type: 'json',
            isNullable: true,
            comment: 'Preferências do usuário em JSON',
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
            name: 'idx_email',
            columnNames: ['email'],
          }),
          new TableIndex({
            name: 'idx_role',
            columnNames: ['role'],
          }),
          new TableIndex({
            name: 'idx_active',
            columnNames: ['is_active'],
          }),
          new TableIndex({
            name: 'idx_created',
            columnNames: ['created_at'],
          }),
        ],
      }),
      true,
    );

    // Criar índice fulltext para busca por nome
    await queryRunner.query(
      'ALTER TABLE usr_users ADD FULLTEXT idx_name (first_name, last_name)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('usr_users');
  }
}
