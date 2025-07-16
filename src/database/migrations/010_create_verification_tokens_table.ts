import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateVerificationTokensTable1705153300000 implements MigrationInterface {
  name = 'CreateVerificationTokensTable1705153300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'usr_verification_tokens',
        columns: [
          {
            name: 'id',
            type: 'char',
            length: '36',
            isPrimary: true,
            default: '(UUID())',
            comment: 'Identificador único do token',
          },
          {
            name: 'user_id',
            type: 'char',
            length: '36',
            comment: 'ID do usuário',
          },
          {
            name: 'token',
            type: 'varchar',
            length: '255',
            isUnique: true,
            comment: 'Token de verificação único',
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['email_verification', 'password_reset', 'phone_verification'],
            comment: 'Tipo do token de verificação',
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            comment: 'Data de expiração do token',
          },
          {
            name: 'used_at',
            type: 'timestamp',
            isNullable: true,
            comment: 'Data de uso do token',
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
            name: 'idx_user_id',
            columnNames: ['user_id'],
          }),
          new TableIndex({
            name: 'idx_token',
            columnNames: ['token'],
          }),
          new TableIndex({
            name: 'idx_type',
            columnNames: ['type'],
          }),
          new TableIndex({
            name: 'idx_expires',
            columnNames: ['expires_at'],
          }),
        ],
      }),
      true,
    );

    // Criar foreign key
    await queryRunner.createForeignKey(
      'usr_verification_tokens',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'usr_users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_usr_verification_tokens_user_id',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('usr_verification_tokens', 'FK_usr_verification_tokens_user_id');
    await queryRunner.dropTable('usr_verification_tokens');
  }
}
