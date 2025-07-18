import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Feature } from '../../modules/plans/entities/feature.entity';

/**
 * Seeds para features do sistema
 * 
 * @description Cria features básicas do sistema NeuralContent
 * 
 * @author NeuralContent Team
 * @since 2.14.0
 */

interface FeatureSeedData {
  keyName: string;
  name: string;
  description: string;
  category: string;
  isActive: boolean;
}

const featuresData: FeatureSeedData[] = [
  // Features de Geração de Conteúdo
  {
    keyName: 'ai_content_generation',
    name: 'Geração de Conteúdo com IA',
    description: 'Crie artigos, posts e textos usando inteligência artificial avançada',
    category: 'content',
    isActive: true,
  },
  {
    keyName: 'unlimited_ai_requests',
    name: 'Solicitações de IA Ilimitadas',
    description: 'Faça quantas solicitações quiser para a IA sem limites mensais',
    category: 'content',
    isActive: true,
  },
  {
    keyName: 'content_templates',
    name: 'Templates de Conteúdo',
    description: 'Acesse uma biblioteca de templates profissionais para diferentes tipos de conteúdo',
    category: 'content',
    isActive: true,
  },

  // Features de Tradução
  {
    keyName: 'document_translation',
    name: 'Tradução de Documentos',
    description: 'Traduza documentos automaticamente com IA de alta qualidade',
    category: 'translation',
    isActive: true,
  },
  {
    keyName: 'unlimited_translations',
    name: 'Traduções Ilimitadas',
    description: 'Traduza quantos documentos quiser sem restrições mensais',
    category: 'translation',
    isActive: true,
  },
  {
    keyName: 'multi_language_support',
    name: 'Suporte a Múltiplos Idiomas',
    description: 'Traduza para mais de 50 idiomas diferentes com qualidade profissional',
    category: 'translation',
    isActive: true,
  },

  // Features de Análise e Insights
  {
    keyName: 'content_analytics',
    name: 'Análise de Conteúdo',
    description: 'Obtenha insights detalhados sobre o desempenho do seu conteúdo',
    category: 'analytics',
    isActive: true,
  },
  {
    keyName: 'seo_optimization',
    name: 'Otimização para SEO',
    description: 'Análise e sugestões automáticas de SEO para melhorar o ranqueamento',
    category: 'analytics',
    isActive: true,
  },
  {
    keyName: 'readability_analysis',
    name: 'Análise de Legibilidade',
    description: 'Avalie e melhore a legibilidade dos seus textos automaticamente',
    category: 'analytics',
    isActive: true,
  },

  // Features de Colaboração
  {
    keyName: 'team_collaboration',
    name: 'Colaboração em Equipe',
    description: 'Trabalhe em projetos com múltiplos usuários simultaneamente',
    category: 'collaboration',
    isActive: true,
  },
  {
    keyName: 'shared_workspaces',
    name: 'Espaços de Trabalho Compartilhados',
    description: 'Crie e gerencie espaços de trabalho compartilhados com sua equipe',
    category: 'collaboration',
    isActive: true,
  },
  {
    keyName: 'version_history',
    name: 'Histórico de Versões',
    description: 'Acompanhe e restaure versões anteriores dos seus documentos',
    category: 'collaboration',
    isActive: true,
  },

  // Features de Integração
  {
    keyName: 'api_access',
    name: 'Acesso à API',
    description: 'Integre o NeuralContent com suas próprias aplicações via API REST',
    category: 'integration',
    isActive: true,
  },
  {
    keyName: 'webhook_support',
    name: 'Suporte a Webhooks',
    description: 'Receba notificações em tempo real sobre eventos no sistema',
    category: 'integration',
    isActive: true,
  },
  {
    keyName: 'export_formats',
    name: 'Múltiplos Formatos de Exportação',
    description: 'Exporte conteúdo em PDF, Word, HTML, Markdown e outros formatos',
    category: 'integration',
    isActive: true,
  },

  // Features de Suporte
  {
    keyName: 'priority_support',
    name: 'Suporte Prioritário',
    description: 'Receba suporte técnico prioritário com tempo de resposta reduzido',
    category: 'support',
    isActive: true,
  },
  {
    keyName: 'advanced_training',
    name: 'Treinamento Avançado',
    description: 'Acesso a materiais de treinamento avançado e webinars exclusivos',
    category: 'support',
    isActive: true,
  },
  {
    keyName: 'custom_onboarding',
    name: 'Onboarding Personalizado',
    description: 'Processo de integração personalizado para empresas',
    category: 'support',
    isActive: true,
  },

  // Features de Segurança
  {
    keyName: 'advanced_security',
    name: 'Segurança Avançada',
    description: 'Recursos avançados de segurança como 2FA e criptografia end-to-end',
    category: 'security',
    isActive: true,
  },
  {
    keyName: 'data_backup',
    name: 'Backup de Dados',
    description: 'Backup automático e redundante de todos os seus dados',
    category: 'security',
    isActive: true,
  },
  {
    keyName: 'compliance_tools',
    name: 'Ferramentas de Compliance',
    description: 'Ferramentas para conformidade com LGPD, GDPR e outras regulamentações',
    category: 'security',
    isActive: true,
  },
];

export async function runFeatureSeeds(): Promise<void> {
  const featureRepository: Repository<Feature> = AppDataSource.getRepository(Feature);

  try {
    console.log('   🚀 Criando features do sistema...');

    for (const featureData of featuresData) {
      // Verificar se feature já existe
      const existingFeature = await featureRepository.findOne({
        where: { keyName: featureData.keyName }
      });

      if (existingFeature) {
        console.log(`   ⏭️  Feature ${featureData.keyName} já existe, pulando...`);
        continue;
      }

      // Criar feature
      const feature = featureRepository.create({
        keyName: featureData.keyName,
        name: featureData.name,
        description: featureData.description,
        category: featureData.category,
        isActive: featureData.isActive,
      });

      await featureRepository.save(feature);
      
      console.log(`   ✅ Feature criada - ${featureData.keyName} | ${featureData.category} | ${featureData.name}`);
    }

    console.log(`   🎯 Total de features processadas: ${featuresData.length}`);

  } catch (error) {
    console.error('   ❌ Erro ao criar seeds de features:', error);
    throw error;
  }
}
