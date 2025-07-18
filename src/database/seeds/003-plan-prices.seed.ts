import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Plan } from '../../modules/plans/entities/plan.entity';
import { PlanPrice, Currency, BillingPeriod } from '../../modules/plans/entities/plan-price.entity';

/**
 * Seeds para preços dos planos
 * 
 * @description Cria preços em diferentes moedas (BRL, USD)
 * e períodos de cobrança (mensal, anual)
 * 
 * @author NeuralContent Team
 * @since 2.14.0
 */

interface PlanPriceSeedData {
  planSlug: string;
  currency: Currency;
  intervalType: BillingPeriod;
  amount: number;
  isActive: boolean;
}

const planPricesData: PlanPriceSeedData[] = [
  // Plano Free - BRL
  {
    planSlug: 'free',
    currency: Currency.BRL,
    intervalType: BillingPeriod.MONTHLY,
    amount: 0,
    isActive: true,
  },
  {
    planSlug: 'free',
    currency: Currency.BRL,
    intervalType: BillingPeriod.YEARLY,
    amount: 0,
    isActive: true,
  },

  // Plano Free - USD
  {
    planSlug: 'free',
    currency: Currency.USD,
    intervalType: BillingPeriod.MONTHLY,
    amount: 0,
    isActive: true,
  },
  {
    planSlug: 'free',
    currency: Currency.USD,
    intervalType: BillingPeriod.YEARLY,
    amount: 0,
    isActive: true,
  },

  // Plano Basic - BRL
  {
    planSlug: 'basic',
    currency: Currency.BRL,
    intervalType: BillingPeriod.MONTHLY,
    amount: 29.99,
    isActive: true,
  },
  {
    planSlug: 'basic',
    currency: Currency.BRL,
    intervalType: BillingPeriod.YEARLY,
    amount: 299.90,
    isActive: true,
  },

  // Plano Basic - USD
  {
    planSlug: 'basic',
    currency: Currency.USD,
    intervalType: BillingPeriod.MONTHLY,
    amount: 5.99,
    isActive: true,
  },
  {
    planSlug: 'basic',
    currency: Currency.USD,
    intervalType: BillingPeriod.YEARLY,
    amount: 59.99,
    isActive: true,
  },

  // Plano Premium - BRL
  {
    planSlug: 'premium',
    currency: Currency.BRL,
    intervalType: BillingPeriod.MONTHLY,
    amount: 79.99,
    isActive: true,
  },
  {
    planSlug: 'premium',
    currency: Currency.BRL,
    intervalType: BillingPeriod.YEARLY,
    amount: 799.90,
    isActive: true,
  },

  // Plano Premium - USD
  {
    planSlug: 'premium',
    currency: Currency.USD,
    intervalType: BillingPeriod.MONTHLY,
    amount: 15.99,
    isActive: true,
  },
  {
    planSlug: 'premium',
    currency: Currency.USD,
    intervalType: BillingPeriod.YEARLY,
    amount: 159.99,
    isActive: true,
  },

  // Plano Enterprise - BRL
  {
    planSlug: 'enterprise',
    currency: Currency.BRL,
    intervalType: BillingPeriod.MONTHLY,
    amount: 199.99,
    isActive: true,
  },
  {
    planSlug: 'enterprise',
    currency: Currency.BRL,
    intervalType: BillingPeriod.YEARLY,
    amount: 1999.90,
    isActive: true,
  },

  // Plano Enterprise - USD
  {
    planSlug: 'enterprise',
    currency: Currency.USD,
    intervalType: BillingPeriod.MONTHLY,
    amount: 39.99,
    isActive: true,
  },
  {
    planSlug: 'enterprise',
    currency: Currency.USD,
    intervalType: BillingPeriod.YEARLY,
    amount: 399.99,
    isActive: true,
  },
];

export async function runPlanPriceSeeds(): Promise<void> {
  const planRepository: Repository<Plan> = AppDataSource.getRepository(Plan);
  const planPriceRepository: Repository<PlanPrice> = AppDataSource.getRepository(PlanPrice);

  try {
    console.log('   💰 Criando preços dos planos...');

    for (const priceData of planPricesData) {
      // Buscar o plano pelo slug
      const plan = await planRepository.findOne({
        where: { slug: priceData.planSlug }
      });

      if (!plan) {
        console.log(`   ⚠️  Plano ${priceData.planSlug} não encontrado, pulando preço...`);
        continue;
      }

      // Verificar se preço já existe
      const existingPrice = await planPriceRepository.findOne({
        where: {
          planId: plan.id,
          currency: priceData.currency,
          intervalType: priceData.intervalType,
        }
      });

      if (existingPrice) {
        console.log(`   ⏭️  Preço ${priceData.currency}/${priceData.intervalType} para ${priceData.planSlug} já existe, pulando...`);
        continue;
      }

      // Criar preço
      const planPrice = planPriceRepository.create({
        planId: plan.id,
        currency: priceData.currency,
        intervalType: priceData.intervalType,
        amount: priceData.amount,
        isActive: priceData.isActive,
        intervalCount: 1,
      });

      await planPriceRepository.save(planPrice);
      
      const formattedPrice = priceData.currency === Currency.BRL 
        ? `R$ ${priceData.amount.toFixed(2)}`
        : `$${priceData.amount.toFixed(2)}`;
      
      console.log(`   ✅ Preço criado - ${priceData.planSlug} | ${priceData.currency} | ${priceData.intervalType} | ${formattedPrice}`);
    }

    console.log(`   🎯 Total de preços processados: ${planPricesData.length}`);

  } catch (error) {
    console.error('   ❌ Erro ao criar seeds de preços:', error);
    throw error;
  }
}
