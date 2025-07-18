import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { User } from '../../modules/users/entities/user.entity';
import { CreditBalance } from '../../modules/credits/entities/credit-balance.entity';

/**
 * Seeds para saldos de crédito dos usuários
 * 
 * @description Cria saldos iniciais de crédito para os usuários de desenvolvimento
 * 
 * @author NeuralContent Team
 * @since 2.14.0
 */

interface CreditBalanceSeedData {
  userEmail: string;
  monthlyCredits: number;
  extraCredits: number;
  description: string;
}

const creditBalancesData: CreditBalanceSeedData[] = [
  // Super Admin - Créditos abundantes para testes
  {
    userEmail: 'superadmin@neuralcontent.com',
    monthlyCredits: 100000,
    extraCredits: 50000,
    description: 'Créditos iniciais para Super Admin - Desenvolvimento',
  },

  // Admin - Muitos créditos para testes administrativos
  {
    userEmail: 'admin@neuralcontent.com',
    monthlyCredits: 10000,
    extraCredits: 5000,
    description: 'Créditos iniciais para Admin - Desenvolvimento',
  },

  // Usuário Premium - Créditos generosos
  {
    userEmail: 'premium@neuralcontent.com',
    monthlyCredits: 5000,
    extraCredits: 2000,
    description: 'Créditos iniciais para usuário Premium - Desenvolvimento',
  },

  // Usuário Basic - Créditos moderados
  {
    userEmail: 'basic@neuralcontent.com',
    monthlyCredits: 1000,
    extraCredits: 500,
    description: 'Créditos iniciais para usuário Basic - Desenvolvimento',
  },

  // Usuário Free - Poucos créditos
  {
    userEmail: 'free@neuralcontent.com',
    monthlyCredits: 100,
    extraCredits: 50,
    description: 'Créditos iniciais para usuário Free - Desenvolvimento',
  },

  // Usuário Guest - Créditos mínimos
  {
    userEmail: 'guest@neuralcontent.com',
    monthlyCredits: 10,
    extraCredits: 5,
    description: 'Créditos iniciais para usuário Guest - Desenvolvimento',
  },

  // Usuário de Teste - Créditos para testes específicos
  {
    userEmail: 'teste@neuralcontent.com',
    monthlyCredits: 500,
    extraCredits: 250,
    description: 'Créditos iniciais para usuário de Teste - Desenvolvimento',
  },
];

export async function runCreditBalanceSeeds(): Promise<void> {
  const userRepository: Repository<User> = AppDataSource.getRepository(User);
  const creditBalanceRepository: Repository<CreditBalance> = AppDataSource.getRepository(CreditBalance);

  try {
    console.log('   💳 Criando saldos de crédito...');

    for (const balanceData of creditBalancesData) {
      // Buscar o usuário pelo email
      const user = await userRepository.findOne({
        where: { email: balanceData.userEmail }
      });

      if (!user) {
        console.log(`   ⚠️  Usuário ${balanceData.userEmail} não encontrado, pulando créditos...`);
        continue;
      }

      // Verificar se saldo já existe
      const existingBalance = await creditBalanceRepository.findOne({
        where: { userId: user.id.toString() }
      });

      if (existingBalance) {
        console.log(`   ⏭️  Saldo para ${balanceData.userEmail} já existe, pulando...`);
        continue;
      }

      // Calcular data de reset mensal (próximo mês)
      const monthlyResetAt = new Date();
      monthlyResetAt.setMonth(monthlyResetAt.getMonth() + 1);
      monthlyResetAt.setDate(1);
      monthlyResetAt.setHours(0, 0, 0, 0);

      // Criar saldo de crédito
      const creditBalance = creditBalanceRepository.create({
        userId: user.id.toString(),
        monthlyCredits: balanceData.monthlyCredits,
        monthlyUsed: 0,
        monthlyResetAt: monthlyResetAt,
        extraCredits: balanceData.extraCredits,
        extraUsed: 0,
        totalEarned: balanceData.monthlyCredits + balanceData.extraCredits,
        totalConsumed: 0,
      });

      await creditBalanceRepository.save(creditBalance);
      
      const totalCredits = balanceData.monthlyCredits + balanceData.extraCredits;
      console.log(`   ✅ Saldo criado - ${balanceData.userEmail} | ${totalCredits.toLocaleString()} créditos totais`);
    }

    console.log(`   🎯 Total de saldos processados: ${creditBalancesData.length}`);

  } catch (error) {
    console.error('   ❌ Erro ao criar seeds de saldos de crédito:', error);
    throw error;
  }
}
