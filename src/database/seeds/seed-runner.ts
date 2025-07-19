import { DataSource } from 'typeorm';
import { DefaultPlansSeed } from './001-default-plans.seed';
import { AdminUserSeed } from './002-admin-user.seed';
import { SystemConfigSeed } from './003-system-config.seed';

export class SeedRunner {
  private dataSource: DataSource;
  
  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  public async runAllSeeds(): Promise<void> {
    console.log('🌱 Iniciando execução de todos os seeds...');
    console.log('=' .repeat(50));

    try {
      // PASSO 1: Executar seed de planos padrão
      console.log('\n📋 PASSO 1: Criando planos padrão...');
      const plansSeed = new DefaultPlansSeed();
      await plansSeed.run(this.dataSource);

      // PASSO 2: Executar seed do usuário admin
      console.log('\n👤 PASSO 2: Criando usuário administrador...');
      const adminSeed = new AdminUserSeed();
      await adminSeed.run(this.dataSource);

      // PASSO 3: Executar seed das configurações do sistema
      console.log('\n⚙️  PASSO 3: Configurando sistema...');
      const configSeed = new SystemConfigSeed();
      await configSeed.run(this.dataSource);

      console.log('\n' + '=' .repeat(50));
      console.log('✅ TODOS OS SEEDS EXECUTADOS COM SUCESSO!');
      console.log('=' .repeat(50));
      
      console.log('\n📊 RESUMO DA EXECUÇÃO:');
      console.log('   ✅ Planos de assinatura criados (Free, Basic, Premium)');
      console.log('   ✅ Usuário administrador criado');
      console.log('   ✅ Configurações de sistema definidas');
      
      console.log('\n🔐 CREDENCIAIS DE ACESSO:');
      console.log('   Email: admin@neuralcontent.com');
      console.log('   Senha: NeuralContent@2025');
      console.log('   ⚠️  ALTERE A SENHA APÓS O PRIMEIRO LOGIN!');
      
      console.log('\n🚀 Sistema pronto para uso completo!');

    } catch (error) {
      console.error('\n❌ ERRO DURANTE A EXECUÇÃO DOS SEEDS:');
      console.error('Error:', error.message);
      
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
      
      throw error;
    }
  }

  // Método para executar seeds individualmente
  public async runSeed(seedName: string): Promise<void> {
    console.log(`🌱 Executando seed: ${seedName}...`);

    try {
      switch (seedName.toLowerCase()) {
        case 'plans':
        case 'default-plans':
          const plansSeed = new DefaultPlansSeed();
          await plansSeed.run(this.dataSource);
          break;

        case 'admin':
        case 'admin-user':
          const adminSeed = new AdminUserSeed();
          await adminSeed.run(this.dataSource);
          break;

        case 'config':
        case 'system-config':
          const configSeed = new SystemConfigSeed();
          await configSeed.run(this.dataSource);
          break;

        default:
          throw new Error(`Seed '${seedName}' não encontrado. Seeds disponíveis: plans, admin, config`);
      }

      console.log(`✅ Seed '${seedName}' executado com sucesso!`);

    } catch (error) {
      console.error(`❌ Erro ao executar seed '${seedName}':`, error.message);
      throw error;
    }
  }

  // Método para listar todos os seeds disponíveis
  public listAvailableSeeds(): string[] {
    return [
      'plans (001-default-plans.seed.ts)',
      'admin (002-admin-user.seed.ts)', 
      'config (003-system-config.seed.ts)'
    ];
  }
}

// Função principal para execução standalone
export async function runSeeds(dataSource: DataSource, seedName?: string): Promise<void> {
  const runner = new SeedRunner(dataSource);

  if (seedName) {
    await runner.runSeed(seedName);
  } else {
    await runner.runAllSeeds();
  }
}
