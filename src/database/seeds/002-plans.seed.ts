import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Plan, PlanType } from '../../modules/plans/entities/plan.entity';

/**
 * Seeds para planos de desenvolvimento
 * 
 * @description Cria planos base (Free, Pro, Enterprise)
 * com configurações padrão
 * 
 * @author NeuralContent Team
 * @since 2.14.0
 */

interface PlanSeedData {
  name: string;
  slug: string;
  description: string;
  type: PlanType;
  monthlyPrice: number;
  annualPrice: number;
  monthlyCredits: number;
  isActive: boolean;
  sortOrder: number;
  features: string[];
}

const plansData: PlanSeedData[] = [
  // Plano Free
  {
    name: 'Free',
    slug: 'free',
    description: 'Plano gratuito com funcionalidades básicas para começar a usar a plataforma NeuralContent.',
    type: PlanType.FREE,
    monthlyPrice: 0,
    annualPrice: 0,
    monthlyCredits: 100,
    isActive: true,
    sortOrder: 1,
    features: [
      'limited_translations',
      'basic_content_generation',
      'standard_support',
      'basic_analytics',
    ],
  },

  // Plano Basic
  {
    name: 'Basic',
    slug: 'basic',
    description: 'Plano básico ideal para freelancers e pequenos negócios que precisam de mais recursos.',
    type: PlanType.BASIC,
    monthlyPrice: 2999, // R$ 29,99
    annualPrice: 29990, // R$ 299,90 (economiza ~17%)
    monthlyCredits: 1000,
    isActive: true,
    sortOrder: 2,
    features: [
      'unlimited_translations',
      'advanced_content_generation',
      'priority_support',
      'advanced_analytics',
      'export_formats',
    ],
  },

  // Plano Premium
  {
    name: 'Premium',
    slug: 'premium',
    description: 'Plano premium para profissionais e empresas que precisam de recursos avançados e maior volume.',
    type: PlanType.PREMIUM,
    monthlyPrice: 7999, // R$ 79,99
    annualPrice: 79990, // R$ 799,90 (economiza ~17%)
    monthlyCredits: 5000,
    isActive: true,
    sortOrder: 3,
    features: [
      'unlimited_translations',
      'premium_content_generation',
      'ai_optimization',
      'bulk_processing',
      'priority_support',
      'advanced_analytics',
      'white_label',
      'api_access',
    ],
  },

  // Plano Enterprise
  {
    name: 'Enterprise',
    slug: 'enterprise',
    description: 'Solução completa para grandes empresas com recursos ilimitados e suporte dedicado.',
    type: PlanType.ENTERPRISE,
    monthlyPrice: 19999, // R$ 199,99
    annualPrice: 199990, // R$ 1.999,90 (economiza ~17%)
    monthlyCredits: 20000,
    isActive: true,
    sortOrder: 4,
    features: [
      'unlimited_everything',
      'enterprise_content_generation',
      'ai_optimization',
      'bulk_processing',
      'dedicated_support',
      'custom_analytics',
      'white_label',
      'api_access',
      'custom_integrations',
      'sla_guarantee',
    ],
  },
];

export async function runPlanSeeds(): Promise<void> {
  const planRepository: Repository<Plan> = AppDataSource.getRepository(Plan);

  try {
    console.log('   📦 Criando planos base...');

    for (const planData of plansData) {
      // Verificar se plano já existe
      const existingPlan = await planRepository.findOne({
        where: { slug: planData.slug }
      });

      if (existingPlan) {
        console.log(`   ⏭️  Plano ${planData.name} já existe, pulando...`);
        continue;
      }

      // Criar plano
      const plan = planRepository.create({
        name: planData.name,
        slug: planData.slug,
        description: planData.description,
        type: planData.type,
        monthlyPrice: planData.monthlyPrice,
        annualPrice: planData.annualPrice,
        monthlyCredits: planData.monthlyCredits,
        isActive: planData.isActive,
        sortOrder: planData.sortOrder,
        metadata: {
          features: planData.features,
          highlight: planData.type === PlanType.PREMIUM, // Destacar plano Premium
          popular: planData.type === PlanType.BASIC,     // Marcar Basic como popular
        },
      });

      await planRepository.save(plan);
      
      console.log(`   ✅ Plano ${planData.name} criado - Tipo: ${planData.type} - Preço: R$ ${(planData.monthlyPrice / 100).toFixed(2)}/mês`);
    }

    console.log(`   🎯 Total de planos processados: ${plansData.length}`);

  } catch (error) {
    console.error('   ❌ Erro ao criar seeds de planos:', error);
    throw error;
  }
}
