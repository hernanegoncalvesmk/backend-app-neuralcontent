import { DataSource } from 'typeorm';

/**
 * Seed: Planos Padrão do Sistema
 * 
 * @description Cria os planos iniciais obrigatórios do NeuralContent usando SQL direto
 * para compatibilidade total com as migrations:
 * - Free: Plano gratuito básico
 * - Basic: Plano básico pago
 * - Premium: Plano premium com recursos avançados
 * 
 * @author NeuralContent Team - Arquiteto Senior
 * @since 1.0.0
 */
export class DefaultPlansSeed {
  public async run(dataSource: DataSource): Promise<void> {
    console.log('🌱 Executando seed: Planos Padrão...');

    // Verificar se já existem planos
    const existingPlans = await dataSource.query('SELECT COUNT(*) as count FROM pln_plans');
    if (existingPlans[0].count > 0) {
      console.log('ℹ️ Planos já existem no banco. Pulando seed...');
      return;
    }

    try {
      // 1. PLANO FREE
      const freePlanResult = await dataSource.query(`
        INSERT INTO pln_plans (
          id, name, slug, description, type, monthly_price, annual_price, 
          monthly_credits, is_active, is_featured, sort_order, metadata
        ) VALUES (
          UUID(), 'Free', 'free', 
          'Plano gratuito para começar a usar o NeuralContent com recursos básicos.',
          'free', 0, 0, 100, true, false, 1,
          '{"color": "#6b7280", "icon": "gift", "badge": "Gratuito", "popular": false}'
        )
      `);

      // Obter ID do plano Free
      const freePlanData = await dataSource.query('SELECT id FROM pln_plans WHERE slug = "free" LIMIT 1');
      const freePlanId = freePlanData[0].id;

      // Features do plano Free
      await dataSource.query(`
        INSERT INTO pln_plan_features (
          plan_id, feature_key, feature_name, feature_description, feature_type, 
          feature_value, is_enabled, is_unlimited, numeric_limit, unit_type, 
          sort_order, metadata
        ) VALUES 
        (?, 'monthly_credits', 'Créditos Mensais', '100 créditos por mês para uso básico', 'limit', '{"limit": 100}', true, false, 100, 'credits', 1, '{"icon": "credit-card", "type": "limit"}'),
        (?, 'text_generation', 'Geração de Texto', 'Criação de textos básicos com IA', 'access', '{"enabled": true}', true, false, NULL, NULL, 2, '{"icon": "edit", "type": "feature"}'),
        (?, 'document_translation', 'Tradução de Documentos', 'Tradução básica entre idiomas', 'limit', '{"limit": 5}', true, false, 5, 'documents', 3, '{"icon": "globe", "type": "limit"}'),
        (?, 'basic_support', 'Suporte Básico', 'Suporte por email com resposta em até 48h', 'access', '{"enabled": true}', true, false, NULL, NULL, 4, '{"icon": "help-circle", "type": "support"}')
      `, [freePlanId, freePlanId, freePlanId, freePlanId]);

      // 2. PLANO BASIC
      await dataSource.query(`
        INSERT INTO pln_plans (
          id, name, slug, description, type, monthly_price, annual_price, 
          monthly_credits, is_active, is_featured, sort_order, metadata
        ) VALUES (
          UUID(), 'Basic', 'basic',
          'Plano básico ideal para usuários individuais com necessidades regulares de conteúdo.',
          'basic', 2990, 29990, 1000, true, false, 2,
          '{"color": "#3b82f6", "icon": "user", "badge": "Mais Popular", "popular": true}'
        )
      `);

      const basicPlanData = await dataSource.query('SELECT id FROM pln_plans WHERE slug = "basic" LIMIT 1');
      const basicPlanId = basicPlanData[0].id;

      // Features do plano Basic
      await dataSource.query(`
        INSERT INTO pln_plan_features (
          plan_id, feature_key, feature_name, feature_description, feature_type, 
          feature_value, is_enabled, is_unlimited, numeric_limit, unit_type, 
          sort_order, metadata
        ) VALUES 
        (?, 'monthly_credits', 'Créditos Mensais', '1.000 créditos por mês para uso regular', 'limit', '{"limit": 1000}', true, false, 1000, 'credits', 1, '{"icon": "credit-card", "type": "limit"}'),
        (?, 'text_generation', 'Geração de Texto Avançada', 'Criação de textos com modelos avançados de IA', 'access', '{"enabled": true}', true, false, NULL, NULL, 2, '{"icon": "edit", "type": "feature"}'),
        (?, 'document_translation', 'Tradução Ilimitada', 'Tradução ilimitada de documentos', 'access', '{"enabled": true}', true, true, NULL, NULL, 3, '{"icon": "globe", "type": "unlimited"}'),
        (?, 'image_generation', 'Geração de Imagens', 'Criação de imagens com IA', 'limit', '{"limit": 50}', true, false, 50, 'images', 4, '{"icon": "image", "type": "limit"}'),
        (?, 'document_analysis', 'Análise de Documentos', 'Análise e extração de informações de documentos', 'limit', '{"limit": 100}', true, false, 100, 'documents', 5, '{"icon": "file-text", "type": "limit"}'),
        (?, 'priority_support', 'Suporte Prioritário', 'Suporte por email com resposta em até 24h', 'access', '{"enabled": true}', true, false, NULL, NULL, 6, '{"icon": "help-circle", "type": "support"}')
      `, [basicPlanId, basicPlanId, basicPlanId, basicPlanId, basicPlanId, basicPlanId]);

      // 3. PLANO PREMIUM
      await dataSource.query(`
        INSERT INTO pln_plans (
          id, name, slug, description, type, monthly_price, annual_price, 
          monthly_credits, is_active, is_featured, sort_order, metadata
        ) VALUES (
          UUID(), 'Premium', 'premium',
          'Plano premium para profissionais e empresas que precisam do máximo em recursos de IA.',
          'premium', 9990, 99990, 5000, true, true, 3,
          '{"color": "#f59e0b", "icon": "crown", "badge": "Profissional", "popular": false}'
        )
      `);

      const premiumPlanData = await dataSource.query('SELECT id FROM pln_plans WHERE slug = "premium" LIMIT 1');
      const premiumPlanId = premiumPlanData[0].id;

      // Features do plano Premium
      await dataSource.query(`
        INSERT INTO pln_plan_features (
          plan_id, feature_key, feature_name, feature_description, feature_type, 
          feature_value, is_enabled, is_unlimited, numeric_limit, unit_type, 
          sort_order, metadata
        ) VALUES 
        (?, 'monthly_credits', 'Créditos Mensais', '5.000 créditos por mês para uso profissional', 'limit', '{"limit": 5000}', true, false, 5000, 'credits', 1, '{"icon": "credit-card", "type": "limit"}'),
        (?, 'text_generation_unlimited', 'Geração de Texto Ilimitada', 'Criação ilimitada de textos com todos os modelos de IA', 'access', '{"enabled": true}', true, true, NULL, NULL, 2, '{"icon": "edit", "type": "unlimited"}'),
        (?, 'document_translation_unlimited', 'Tradução Ilimitada', 'Tradução ilimitada com suporte a todos os idiomas', 'access', '{"enabled": true}', true, true, NULL, NULL, 3, '{"icon": "globe", "type": "unlimited"}'),
        (?, 'image_generation_unlimited', 'Geração de Imagens Ilimitada', 'Criação ilimitada de imagens com IA avançada', 'access', '{"enabled": true}', true, true, NULL, NULL, 4, '{"icon": "image", "type": "unlimited"}'),
        (?, 'audio_generation', 'Geração de Áudio', 'Criação de áudio e voice-over com IA', 'limit', '{"limit": 200}', true, false, 200, 'minutes', 5, '{"icon": "mic", "type": "limit"}'),
        (?, 'video_generation', 'Geração de Vídeo', 'Criação de vídeos curtos com IA', 'limit', '{"limit": 50}', true, false, 50, 'videos', 6, '{"icon": "video", "type": "limit"}'),
        (?, 'advanced_analytics', 'Analytics Avançado', 'Relatórios detalhados de uso e performance', 'access', '{"enabled": true}', true, false, NULL, NULL, 7, '{"icon": "bar-chart", "type": "feature"}'),
        (?, 'api_access', 'Acesso à API', 'Acesso completo à API do NeuralContent', 'limit', '{"limit": 10000}', true, false, 10000, 'requests', 8, '{"icon": "code", "type": "limit"}'),
        (?, 'premium_support', 'Suporte Premium', 'Suporte prioritário por chat e email (resposta em até 2h)', 'access', '{"enabled": true}', true, false, NULL, NULL, 9, '{"icon": "headphones", "type": "support"}'),
        (?, 'custom_integrations', 'Integrações Personalizadas', 'Integrações personalizadas com sistemas externos', 'access', '{"enabled": true}', true, false, NULL, NULL, 10, '{"icon": "link", "type": "feature"}')
      `, [premiumPlanId, premiumPlanId, premiumPlanId, premiumPlanId, premiumPlanId, premiumPlanId, premiumPlanId, premiumPlanId, premiumPlanId, premiumPlanId]);

      console.log('✅ Seed de planos concluído com sucesso!');
      console.log(`   - Plano Free: ${freePlanId}`);
      console.log(`   - Plano Basic: ${basicPlanId}`);
      console.log(`   - Plano Premium: ${premiumPlanId}`);
      console.log(`   - Total de features criadas: 24`);

    } catch (error) {
      console.error('❌ Erro ao executar seed de planos:', error);
      throw error;
    }
  }
}
