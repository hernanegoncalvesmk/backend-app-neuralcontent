import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/**
 * Migration: CreateSystemConfigTable
 * 
 * Cria a tabela de configurações do sistema para:
 * - Configurações globais da aplicação
 * - Parâmetros dinâmicos
 * - Feature flags
 * - Configurações de módulos
 * 
 * @author Arquiteto de Sistemas Senior
 * @version 1.0.0
 * @date 2024-01-08
 */
export class CreateSystemConfigTable1704007000000 implements MigrationInterface {
  name = 'CreateSystemConfigTable1704007000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela sys_config
    await queryRunner.createTable(
      new Table({
        name: 'sys_config',
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

          // Campos específicos da configuração
          {
            name: 'config_key',
            type: 'varchar',
            length: '255',
            isUnique: true,
            comment: 'Chave única da configuração',
          },
          {
            name: 'config_value',
            type: 'json',
            isNullable: true,
            comment: 'Valor da configuração em formato JSON',
          },
          {
            name: 'config_type',
            type: 'enum',
            enum: ['string', 'number', 'boolean', 'json', 'array', 'object'],
            default: "'string'",
            comment: 'Tipo de dados da configuração',
          },
          {
            name: 'category',
            type: 'varchar',
            length: '100',
            comment: 'Categoria da configuração',
          },
          {
            name: 'subcategory',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'Subcategoria da configuração',
          },
          {
            name: 'display_name',
            type: 'varchar',
            length: '255',
            comment: 'Nome amigável da configuração',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
            comment: 'Descrição detalhada da configuração',
          },
          {
            name: 'default_value',
            type: 'json',
            isNullable: true,
            comment: 'Valor padrão da configuração',
          },
          {
            name: 'validation_rules',
            type: 'json',
            isNullable: true,
            comment: 'Regras de validação para o valor',
          },
          {
            name: 'is_public',
            type: 'boolean',
            default: false,
            comment: 'Indica se a configuração é pública (acessível via API)',
          },
          {
            name: 'is_editable',
            type: 'boolean',
            default: true,
            comment: 'Indica se a configuração pode ser editada',
          },
          {
            name: 'is_system',
            type: 'boolean',
            default: false,
            comment: 'Indica se é uma configuração crítica do sistema',
          },
          {
            name: 'requires_restart',
            type: 'boolean',
            default: false,
            comment: 'Indica se mudanças requerem reinicialização',
          },
          {
            name: 'environment',
            type: 'enum',
            enum: ['all', 'development', 'staging', 'production'],
            default: "'all'",
            comment: 'Ambiente onde a configuração é válida',
          },
          {
            name: 'module_name',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'Nome do módulo relacionado',
          },
          {
            name: 'feature_flag',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'Feature flag associada',
          },
          {
            name: 'cache_ttl',
            type: 'int',
            isNullable: true,
            comment: 'TTL do cache em segundos',
          },
          {
            name: 'last_modified_by',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Usuário que fez a última modificação',
          },
          {
            name: 'change_log',
            type: 'json',
            isNullable: true,
            comment: 'Log de mudanças da configuração',
          },
          {
            name: 'tags',
            type: 'json',
            isNullable: true,
            comment: 'Tags para categorização adicional',
          },
          {
            name: 'metadata',
            type: 'json',
            isNullable: true,
            comment: 'Metadados adicionais da configuração',
          },
        ],
        indices: [
          // Índices para performance
          {
            name: 'idx_sys_config_config_key',
            columnNames: ['config_key'],
          },
          {
            name: 'idx_sys_config_config_type',
            columnNames: ['config_type'],
          },
          {
            name: 'idx_sys_config_category',
            columnNames: ['category'],
          },
          {
            name: 'idx_sys_config_subcategory',
            columnNames: ['subcategory'],
          },
          {
            name: 'idx_sys_config_is_public',
            columnNames: ['is_public'],
          },
          {
            name: 'idx_sys_config_is_editable',
            columnNames: ['is_editable'],
          },
          {
            name: 'idx_sys_config_is_system',
            columnNames: ['is_system'],
          },
          {
            name: 'idx_sys_config_requires_restart',
            columnNames: ['requires_restart'],
          },
          {
            name: 'idx_sys_config_environment',
            columnNames: ['environment'],
          },
          {
            name: 'idx_sys_config_module_name',
            columnNames: ['module_name'],
          },
          {
            name: 'idx_sys_config_feature_flag',
            columnNames: ['feature_flag'],
          },
          {
            name: 'idx_sys_config_last_modified_by',
            columnNames: ['last_modified_by'],
          },
          
          // Índices compostos
          {
            name: 'idx_sys_config_category_subcategory',
            columnNames: ['category', 'subcategory'],
          },
          {
            name: 'idx_sys_config_public_category',
            columnNames: ['is_public', 'category'],
          },
          {
            name: 'idx_sys_config_system_category',
            columnNames: ['is_system', 'category'],
          },
          {
            name: 'idx_sys_config_environment_category',
            columnNames: ['environment', 'category'],
          },
          {
            name: 'idx_sys_config_module_category',
            columnNames: ['module_name', 'category'],
          },
          {
            name: 'idx_sys_config_editable_public',
            columnNames: ['is_editable', 'is_public'],
          },
        ],
      }),
      true, // ifNotExists
    );

    console.log('✅ Tabela sys_config criada com sucesso');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover tabela
    await queryRunner.dropTable('sys_config');
    
    console.log('✅ Tabela sys_config removida com sucesso');
  }
}
