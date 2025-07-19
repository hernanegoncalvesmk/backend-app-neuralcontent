import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/**
 * Migration: CreateUsersTable
 * 
 * Cria a tabela base de usuários com:
 * - Estrutura completa de campos de usuário
 * - Campos de auditoria (BaseEntity)
 * - Índices para performance
 * - Constraints de segurança
 * - Suporte a soft delete
 * 
 * @author Arquiteto de Sistemas Senior
 * @version 1.0.0
 * @date 2024-01-01
 */
export class CreateUsersTable1704000000000 implements MigrationInterface {
  name = 'CreateUsersTable1704000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela usr_users
    await queryRunner.createTable(
      new Table({
        name: 'usr_users',
        columns: [
          // Campos da BaseEntity
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            comment: 'Identificador único auto-incrementável',
          },
          {
            name: 'created_at',
            type: 'datetime',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6)',
            comment: 'Data e hora de criação do registro',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6)',
            onUpdate: 'CURRENT_TIMESTAMP(6)',
            comment: 'Data e hora da última atualização do registro',
          },
          {
            name: 'deletedAt',
            type: 'datetime',
            precision: 6,
            isNullable: true,
            comment: 'Data e hora de soft delete do registro',
          },
          {
            name: 'version',
            type: 'int',
            default: 1,
            comment: 'Versão do registro para controle de concorrência otimista',
          },

          // Campos específicos do usuário
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            comment: 'Nome completo do usuário',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
            comment: 'Email único do usuário',
          },
          {
            name: 'email_verified',
            type: 'boolean',
            default: false,
            comment: 'Indicador se o email foi verificado',
          },
          {
            name: 'email_verified_at',
            type: 'datetime',
            precision: 6,
            isNullable: true,
            comment: 'Data e hora de verificação do email',
          },
          {
            name: 'password_hash',
            type: 'varchar',
            length: '255',
            comment: 'Hash da senha do usuário (bcrypt)',
          },
          {
            name: 'role',
            type: 'enum',
            enum: ['admin', 'user', 'moderator'],
            default: "'user'",
            comment: 'Papel do usuário no sistema',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'inactive', 'pending', 'suspended'],
            default: "'pending'",
            comment: 'Status atual do usuário',
          },
          {
            name: 'avatar_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
            comment: 'URL do avatar do usuário',
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '20',
            isNullable: true,
            comment: 'Número de telefone do usuário',
          },
          {
            name: 'language',
            type: 'varchar',
            length: '10',
            default: "'pt-BR'",
            comment: 'Idioma preferido do usuário',
          },
          {
            name: 'timezone',
            type: 'varchar',
            length: '50',
            default: "'America/Sao_Paulo'",
            comment: 'Timezone do usuário',
          },
          {
            name: 'last_login_at',
            type: 'datetime',
            precision: 6,
            isNullable: true,
            comment: 'Data e hora do último login',
          },
          {
            name: 'last_login_ip',
            type: 'varchar',
            length: '45',
            isNullable: true,
            comment: 'IP do último login',
          },
          {
            name: 'login_attempts',
            type: 'int',
            default: 0,
            comment: 'Contador de tentativas de login',
          },
          {
            name: 'locked_until',
            type: 'datetime',
            precision: 6,
            isNullable: true,
            comment: 'Data até quando a conta está bloqueada',
          },
          {
            name: 'password_reset_token',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Token para reset de senha',
          },
          {
            name: 'password_reset_expires',
            type: 'datetime',
            precision: 6,
            isNullable: true,
            comment: 'Data de expiração do token de reset',
          },
          {
            name: 'email_verification_token',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Token para verificação de email',
          },
          {
            name: 'email_verification_expires',
            type: 'datetime',
            precision: 6,
            isNullable: true,
            comment: 'Data de expiração do token de verificação',
          },
          {
            name: 'preferences',
            type: 'json',
            isNullable: true,
            comment: 'Preferências do usuário em formato JSON',
          },
          {
            name: 'metadata',
            type: 'json',
            isNullable: true,
            comment: 'Metadados adicionais do usuário',
          },
        ],
        indices: [
          // Índices para performance
          {
            name: 'idx_usr_users_email',
            columnNames: ['email'],
          },
          {
            name: 'idx_usr_users_status',
            columnNames: ['status'],
          },
          {
            name: 'idx_usr_users_role',
            columnNames: ['role'],
          },
          {
            name: 'idx_usr_users_created_at',
            columnNames: ['created_at'],
          },
          {
            name: 'idx_usr_users_email_verified',
            columnNames: ['email_verified'],
          },
          {
            name: 'idx_usr_users_last_login',
            columnNames: ['last_login_at'],
          },
          {
            name: 'idx_usr_users_soft_delete',
            columnNames: ['deletedAt'],
          },
          
          // Índices compostos
          {
            name: 'idx_usr_users_active_users',
            columnNames: ['status', 'deletedAt'],
          },
          {
            name: 'idx_usr_users_role_status',
            columnNames: ['role', 'status'],
          },
        ],
      }),
      true, // ifNotExists
    );

    // Criar índices adicionais para tokens (segurança)
    await queryRunner.createIndex(
      'usr_users',
      new TableIndex({
        name: 'idx_usr_users_password_reset_token',
        columnNames: ['password_reset_token'],
      }),
    );

    await queryRunner.createIndex(
      'usr_users',
      new TableIndex({
        name: 'idx_usr_users_email_verification_token',
        columnNames: ['email_verification_token'],
      }),
    );

    console.log('✅ Tabela usr_users criada com sucesso');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices primeiro
    await queryRunner.dropIndex('usr_users', 'idx_usr_users_email_verification_token');
    await queryRunner.dropIndex('usr_users', 'idx_usr_users_password_reset_token');
    
    // Remover tabela
    await queryRunner.dropTable('usr_users');
    
    console.log('✅ Tabela usr_users removida com sucesso');
  }
}
