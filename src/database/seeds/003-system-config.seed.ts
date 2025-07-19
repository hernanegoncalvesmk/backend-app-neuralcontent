import { DataSource } from 'typeorm';

/**
 * Seed: Configurações Padrão do Sistema
 * 
 * @description Cria as configurações iniciais obrigatórias do NeuralContent usando SQL direto
 * para compatibilidade total com as migrations:
 * - Configurações de API
 * - Configurações de limites
 * - Configurações de features
 * - Configurações de sistema
 * 
 * @author NeuralContent Team - Arquiteto Senior
 * @since 1.0.0
 */
export class SystemConfigSeed {
  public async run(dataSource: DataSource): Promise<void> {
    console.log('🌱 Executando seed: Configurações do Sistema...');

    // Verificar se já existem configurações
    const existingConfigs = await dataSource.query('SELECT COUNT(*) as count FROM sys_configs');
    if (existingConfigs[0].count > 0) {
      console.log('ℹ️ Configurações já existem no banco. Pulando seed...');
      return;
    }

    try {
      // Configurações padrão do sistema
      const configsToInsert = [
        // === CONFIGURAÇÕES DE API ===
        {
          key: 'openai_api_enabled',
          category: 'api',
          name: 'OpenAI API Habilitada',
          description: 'Controla se a integração com OpenAI está ativa',
          value: 'true',
          type: 'boolean',
          isPublic: false,
          isRequired: true,
          sortOrder: 1,
          metadata: JSON.stringify({
            group: 'ai_providers',
            icon: 'brain',
            validation: { type: 'boolean' }
          })
        },
        {
          key: 'openai_default_model',
          category: 'api',
          name: 'Modelo Padrão OpenAI',
          description: 'Modelo padrão para geração de texto',
          value: 'gpt-3.5-turbo',
          type: 'string',
          isPublic: false,
          isRequired: true,
          sortOrder: 2,
          metadata: JSON.stringify({
            group: 'ai_providers',
            icon: 'settings',
            validation: { type: 'string', enum: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'] }
          })
        },

        // === CONFIGURAÇÕES DE CRÉDITOS ===
        {
          key: 'credit_cost_text_generation',
          category: 'credits',
          name: 'Custo - Geração de Texto',
          description: 'Créditos consumidos por geração de texto',
          value: '1',
          type: 'number',
          isPublic: true,
          isRequired: true,
          sortOrder: 10,
          metadata: JSON.stringify({
            group: 'costs',
            icon: 'credit-card',
            validation: { type: 'number', min: 1 }
          })
        },
        {
          key: 'credit_cost_image_generation',
          category: 'credits',
          name: 'Custo - Geração de Imagem',
          description: 'Créditos consumidos por geração de imagem',
          value: '5',
          type: 'number',
          isPublic: true,
          isRequired: true,
          sortOrder: 11,
          metadata: JSON.stringify({
            group: 'costs',
            icon: 'image',
            validation: { type: 'number', min: 1 }
          })
        },
        {
          key: 'credit_cost_translation',
          category: 'credits',
          name: 'Custo - Tradução',
          description: 'Créditos consumidos por tradução de documento',
          value: '2',
          type: 'number',
          isPublic: true,
          isRequired: true,
          sortOrder: 12,
          metadata: JSON.stringify({
            group: 'costs',
            icon: 'globe',
            validation: { type: 'number', min: 1 }
          })
        },

        // === CONFIGURAÇÕES DE LIMITES ===
        {
          key: 'max_file_size_mb',
          category: 'limits',
          name: 'Tamanho Máximo de Arquivo',
          description: 'Tamanho máximo de arquivo em MB',
          value: '10',
          type: 'number',
          isPublic: true,
          isRequired: true,
          sortOrder: 20,
          metadata: JSON.stringify({
            group: 'upload_limits',
            icon: 'upload',
            validation: { type: 'number', min: 1, max: 100 }
          })
        },
        {
          key: 'max_text_length',
          category: 'limits',
          name: 'Comprimento Máximo de Texto',
          description: 'Número máximo de caracteres para geração de texto',
          value: '4000',
          type: 'number',
          isPublic: true,
          isRequired: true,
          sortOrder: 21,
          metadata: JSON.stringify({
            group: 'content_limits',
            icon: 'edit',
            validation: { type: 'number', min: 100, max: 10000 }
          })
        },

        // === CONFIGURAÇÕES DE FEATURES ===
        {
          key: 'feature_image_generation_enabled',
          category: 'features',
          name: 'Geração de Imagem Habilitada',
          description: 'Controla se a feature de geração de imagem está ativa',
          value: 'true',
          type: 'boolean',
          isPublic: true,
          isRequired: true,
          sortOrder: 30,
          metadata: JSON.stringify({
            group: 'ai_features',
            icon: 'image',
            validation: { type: 'boolean' }
          })
        },
        {
          key: 'feature_translation_enabled',
          category: 'features',
          name: 'Tradução Habilitada',
          description: 'Controla se a feature de tradução está ativa',
          value: 'true',
          type: 'boolean',
          isPublic: true,
          isRequired: true,
          sortOrder: 31,
          metadata: JSON.stringify({
            group: 'ai_features',
            icon: 'globe',
            validation: { type: 'boolean' }
          })
        },

        // === CONFIGURAÇÕES DE SISTEMA ===
        {
          key: 'system_maintenance_mode',
          category: 'system',
          name: 'Modo Manutenção',
          description: 'Ativa o modo de manutenção do sistema',
          value: 'false',
          type: 'boolean',
          isPublic: true,
          isRequired: true,
          sortOrder: 40,
          metadata: JSON.stringify({
            group: 'system_status',
            icon: 'wrench',
            validation: { type: 'boolean' }
          })
        },
        {
          key: 'system_default_language',
          category: 'system',
          name: 'Idioma Padrão',
          description: 'Idioma padrão do sistema',
          value: 'pt-BR',
          type: 'string',
          isPublic: true,
          isRequired: true,
          sortOrder: 41,
          metadata: JSON.stringify({
            group: 'localization',
            icon: 'flag',
            validation: { type: 'string', enum: ['pt-BR', 'en-US', 'es-ES'] }
          })
        },

        // === CONFIGURAÇÕES DE EMAIL ===
        {
          key: 'email_notifications_enabled',
          category: 'email',
          name: 'Notificações por Email',
          description: 'Controla se as notificações por email estão ativas',
          value: 'true',
          type: 'boolean',
          isPublic: false,
          isRequired: true,
          sortOrder: 50,
          metadata: JSON.stringify({
            group: 'notifications',
            icon: 'mail',
            validation: { type: 'boolean' }
          })
        },
        {
          key: 'email_from_name',
          category: 'email',
          name: 'Nome do Remetente',
          description: 'Nome exibido nos emails enviados',
          value: 'NeuralContent',
          type: 'string',
          isPublic: false,
          isRequired: true,
          sortOrder: 51,
          metadata: JSON.stringify({
            group: 'email_config',
            icon: 'user',
            validation: { type: 'string', minLength: 2 }
          })
        }
      ];

      // Inserir configurações usando SQL direto
      for (const config of configsToInsert) {
        await dataSource.query(`
          INSERT INTO sys_configs (
            config_key, category, name, description, config_value, value_type,
            is_public, is_required, sort_order, metadata, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          config.key,
          config.category,
          config.name,
          config.description,
          config.value,
          config.type,
          config.isPublic,
          config.isRequired,
          config.sortOrder,
          config.metadata
        ]);
      }

      console.log('✅ Seed de configurações do sistema concluído com sucesso!');
      console.log(`   - Total de configurações criadas: ${configsToInsert.length}`);
      console.log('   - Categorias: api, credits, limits, features, system, email');

    } catch (error) {
      console.error('❌ Erro ao executar seed de configurações:', error);
      throw error;
    }
  }
}
