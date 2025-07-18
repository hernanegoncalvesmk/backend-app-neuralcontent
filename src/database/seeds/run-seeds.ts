import { AppDataSource } from '../data-source';
import { runUserSeeds } from './001-users.seed';
import { runPlanSeeds } from './002-plans.seed';
import { runPlanPriceSeeds } from './003-plan-prices.seed';
import { runCreditBalanceSeeds } from './004-credit-balances.seed';
import { runFeatureSeeds } from './005-features.seed';

/**
 * Script principal para executar todos os seeds de desenvolvimento
 * 
 * @description Executa todos os seeds na ordem correta para popular o banco
 * com dados de desenvolvimento e teste
 * 
 * @author NeuralContent Team
 * @since 2.14.0
 */

async function runAllSeeds() {
  try {
    console.log('🌱 Iniciando execução dos seeds...');
    
    // Inicializar conexão com banco
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Conexão com banco inicializada');
    }

    console.log('\n📋 Executando seeds na ordem correta...\n');

    // 1. Features (sem dependências)
    console.log('🔧 Executando seeds de Features...');
    await runFeatureSeeds();
    console.log('✅ Features criadas com sucesso\n');

    // 2. Usuários (sem dependências)
    console.log('👥 Executando seeds de Usuários...');
    await runUserSeeds();
    console.log('✅ Usuários criados com sucesso\n');

    // 3. Planos (sem dependências)
    console.log('📦 Executando seeds de Planos...');
    await runPlanSeeds();
    console.log('✅ Planos criados com sucesso\n');

    // 4. Preços dos planos (depende de planos)
    console.log('💰 Executando seeds de Preços...');
    await runPlanPriceSeeds();
    console.log('✅ Preços criados com sucesso\n');

    // 5. Saldos de crédito (depende de usuários)
    console.log('🪙 Executando seeds de Saldos de Crédito...');
    await runCreditBalanceSeeds();
    console.log('✅ Saldos criados com sucesso\n');

    console.log('🎉 Todos os seeds executados com sucesso!');
    console.log('\n📊 Dados de desenvolvimento populados:');
    console.log('   - Usuários de teste (admin, users)');
    console.log('   - Planos (Free, Pro, Enterprise)');
    console.log('   - Preços (BRL, USD)');
    console.log('   - Features do sistema');
    console.log('   - Saldos de crédito iniciais');

  } catch (error) {
    console.error('❌ Erro ao executar seeds:', error);
    process.exit(1);
  } finally {
    // Fechar conexão com banco
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('\n🔐 Conexão com banco fechada');
    }
  }
}

// Executar seeds se chamado diretamente
if (require.main === module) {
  runAllSeeds();
}

export { runAllSeeds };
