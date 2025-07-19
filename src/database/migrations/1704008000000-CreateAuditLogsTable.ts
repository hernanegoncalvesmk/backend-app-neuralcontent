import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

/**
 * Migration: CreateAuditLogsTable
 * 
 * Cria a tabela de logs de auditoria para:
 * - Rastreamento de ações dos usuários
 * - Auditoria de segurança
 * - Compliance e conformidade
 * - Histórico de mudanças
 * 
 * @author Arquiteto de Sistemas Senior
 * @version 1.0.0
 * @date 2024-01-09
 */
export class CreateAuditLogsTable1704008000000 implements MigrationInterface {
  name = 'CreateAuditLogsTable1704008000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela aud_audit_logs
    await queryRunner.createTable(
      new Table({
        name: 'aud_audit_logs',
        columns: [
          // Campos da BaseEntity
          {
            name: 'id',
            type: 'bigint',
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

          // Campos específicos do log de auditoria
          {
            name: 'user_id',
            type: 'int',
            isNullable: true,
            comment: 'ID do usuário que executou a ação',
          },
          {
            name: 'session_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'ID da sessão do usuário',
          },
          {
            name: 'action',
            type: 'varchar',
            length: '100',
            comment: 'Ação executada (CREATE, UPDATE, DELETE, LOGIN, etc.)',
          },
          {
            name: 'entity_type',
            type: 'varchar',
            length: '100',
            comment: 'Tipo de entidade afetada',
          },
          {
            name: 'entity_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'ID da entidade afetada',
          },
          {
            name: 'resource_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Nome do recurso acessado',
          },
          {
            name: 'module_name',
            type: 'varchar',
            length: '100',
            comment: 'Nome do módulo/sistema',
          },
          {
            name: 'description',
            type: 'text',
            comment: 'Descrição detalhada da ação',
          },
          {
            name: 'severity',
            type: 'enum',
            enum: ['low', 'medium', 'high', 'critical'],
            default: "'medium'",
            comment: 'Severidade da ação',
          },
          {
            name: 'risk_level',
            type: 'enum',
            enum: ['none', 'low', 'medium', 'high', 'critical'],
            default: "'none'",
            comment: 'Nível de risco da ação',
          },
          {
            name: 'outcome',
            type: 'enum',
            enum: ['success', 'failure', 'partial', 'blocked'],
            comment: 'Resultado da ação',
          },
          {
            name: 'ip_address',
            type: 'varchar',
            length: '45',
            isNullable: true,
            comment: 'Endereço IP de origem',
          },
          {
            name: 'user_agent',
            type: 'text',
            isNullable: true,
            comment: 'User agent do navegador/aplicativo',
          },
          {
            name: 'location',
            type: 'json',
            isNullable: true,
            comment: 'Localização geográfica (cidade, país, etc.)',
          },
          {
            name: 'device_info',
            type: 'json',
            isNullable: true,
            comment: 'Informações do dispositivo',
          },
          {
            name: 'old_values',
            type: 'json',
            isNullable: true,
            comment: 'Valores anteriores (para UPDATE)',
          },
          {
            name: 'new_values',
            type: 'json',
            isNullable: true,
            comment: 'Novos valores (para UPDATE/CREATE)',
          },
          {
            name: 'changes_summary',
            type: 'json',
            isNullable: true,
            comment: 'Resumo das mudanças realizadas',
          },
          {
            name: 'request_data',
            type: 'json',
            isNullable: true,
            comment: 'Dados da requisição',
          },
          {
            name: 'response_data',
            type: 'json',
            isNullable: true,
            comment: 'Dados da resposta',
          },
          {
            name: 'execution_time_ms',
            type: 'int',
            isNullable: true,
            comment: 'Tempo de execução em milissegundos',
          },
          {
            name: 'error_code',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'Código de erro (se aplicável)',
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
            comment: 'Mensagem de erro (se aplicável)',
          },
          {
            name: 'stack_trace',
            type: 'text',
            isNullable: true,
            comment: 'Stack trace do erro (se aplicável)',
          },
          {
            name: 'tags',
            type: 'json',
            isNullable: true,
            comment: 'Tags para categorização',
          },
          {
            name: 'correlation_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'ID de correlação para rastreamento',
          },
          {
            name: 'parent_log_id',
            type: 'bigint',
            isNullable: true,
            comment: 'ID do log pai (para operações aninhadas)',
          },
          {
            name: 'is_sensitive',
            type: 'boolean',
            default: false,
            comment: 'Indica se contém dados sensíveis',
          },
          {
            name: 'retention_days',
            type: 'int',
            isNullable: true,
            comment: 'Dias de retenção do log',
          },
          {
            name: 'expires_at',
            type: 'datetime',
            precision: 6,
            isNullable: true,
            comment: 'Data de expiração do log',
          },
          {
            name: 'metadata',
            type: 'json',
            isNullable: true,
            comment: 'Metadados adicionais do log',
          },
        ],
        indices: [
          // Índices para performance
          {
            name: 'idx_aud_audit_logs_user_id',
            columnNames: ['user_id'],
          },
          {
            name: 'idx_aud_audit_logs_session_id',
            columnNames: ['session_id'],
          },
          {
            name: 'idx_aud_audit_logs_action',
            columnNames: ['action'],
          },
          {
            name: 'idx_aud_audit_logs_entity_type',
            columnNames: ['entity_type'],
          },
          {
            name: 'idx_aud_audit_logs_entity_id',
            columnNames: ['entity_id'],
          },
          {
            name: 'idx_aud_audit_logs_module_name',
            columnNames: ['module_name'],
          },
          {
            name: 'idx_aud_audit_logs_severity',
            columnNames: ['severity'],
          },
          {
            name: 'idx_aud_audit_logs_risk_level',
            columnNames: ['risk_level'],
          },
          {
            name: 'idx_aud_audit_logs_outcome',
            columnNames: ['outcome'],
          },
          {
            name: 'idx_aud_audit_logs_ip_address',
            columnNames: ['ip_address'],
          },
          {
            name: 'idx_aud_audit_logs_correlation_id',
            columnNames: ['correlation_id'],
          },
          {
            name: 'idx_aud_audit_logs_parent_log_id',
            columnNames: ['parent_log_id'],
          },
          {
            name: 'idx_aud_audit_logs_is_sensitive',
            columnNames: ['is_sensitive'],
          },
          {
            name: 'idx_aud_audit_logs_expires_at',
            columnNames: ['expires_at'],
          },
          {
            name: 'idx_aud_audit_logs_created_at',
            columnNames: ['created_at'],
          },
          
          // Índices compostos
          {
            name: 'idx_aud_audit_logs_user_action',
            columnNames: ['user_id', 'action'],
          },
          {
            name: 'idx_aud_audit_logs_user_date',
            columnNames: ['user_id', 'created_at'],
          },
          {
            name: 'idx_aud_audit_logs_entity_action',
            columnNames: ['entity_type', 'action'],
          },
          {
            name: 'idx_aud_audit_logs_entity_lookup',
            columnNames: ['entity_type', 'entity_id'],
          },
          {
            name: 'idx_aud_audit_logs_module_action',
            columnNames: ['module_name', 'action'],
          },
          {
            name: 'idx_aud_audit_logs_severity_risk',
            columnNames: ['severity', 'risk_level'],
          },
          {
            name: 'idx_aud_audit_logs_outcome_date',
            columnNames: ['outcome', 'created_at'],
          },
          {
            name: 'idx_aud_audit_logs_sensitive_expires',
            columnNames: ['is_sensitive', 'expires_at'],
          },
          {
            name: 'idx_aud_audit_logs_date_range',
            columnNames: ['created_at', 'expires_at'],
          },
        ],
      }),
      true, // ifNotExists
    );

    // Criar foreign keys
    await queryRunner.createForeignKey(
      'aud_audit_logs',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'usr_users',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        name: 'fk_aud_audit_logs_user_id',
      }),
    );

    await queryRunner.createForeignKey(
      'aud_audit_logs',
      new TableForeignKey({
        columnNames: ['parent_log_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'aud_audit_logs',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        name: 'fk_aud_audit_logs_parent_log_id',
      }),
    );

    console.log('✅ Tabela aud_audit_logs criada com sucesso');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover foreign keys primeiro
    await queryRunner.dropForeignKey('aud_audit_logs', 'fk_aud_audit_logs_parent_log_id');
    await queryRunner.dropForeignKey('aud_audit_logs', 'fk_aud_audit_logs_user_id');
    
    // Remover tabela
    await queryRunner.dropTable('aud_audit_logs');
    
    console.log('✅ Tabela aud_audit_logs removida com sucesso');
  }
}
