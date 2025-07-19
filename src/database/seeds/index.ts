#!/usr/bin/env node

import { DataSource } from 'typeorm';
import { SeedRunner } from './seed-runner';

// Criar DataSource local
const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || '167.235.253.236',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'app_NeuralContent_8785',
  password: process.env.DB_PASSWORD || '6ZUFqq4o2FsFkFtF',
  database: process.env.DB_NAME || 'app_NeuralContent_8785',
  synchronize: false,
  logging: false,
  entities: [
    'src/**/*.entity{.ts,.js}',
  ],
  migrations: [
    'src/database/migrations/*{.ts,.js}',
  ],
  subscribers: [
    'src/**/*.subscriber{.ts,.js}',
  ],
});

async function main() {
  console.log('🌱 Neural Content - Sistema de Seeds');
  console.log('=' .repeat(50));

  try {
    console.log('🔗 Conectando ao banco de dados...');
    await AppDataSource.initialize();
    console.log('✅ Conexão estabelecida com sucesso!');

    // Criar instância do runner
    const seedRunner = new SeedRunner(AppDataSource);

    // Obter argumentos da linha de comando
    const args = process.argv.slice(2);
    const seedName = args[0]; // Primeiro argumento pode ser o nome do seed específico

    if (seedName && seedName !== 'all') {
      console.log(`\n🎯 Executando seed específico: ${seedName}`);
      await seedRunner.runSeed(seedName);
    } else {
      console.log('\n🌱 Executando todos os seeds...');
      await seedRunner.runAllSeeds();
    }

  } catch (error) {
    console.error('\n❌ ERRO CRÍTICO:');
    console.error('Detalhes:', error.message);
    
    if (error.code) {
      console.error('Código do erro:', error.code);
    }
    
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }

    process.exit(1);

  } finally {
    if (AppDataSource.isInitialized) {
      console.log('\n🔌 Fechando conexão com o banco de dados...');
      await AppDataSource.destroy();
      console.log('✅ Conexão fechada com sucesso!');
    }
  }
}

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Executar função principal
main().catch((error) => {
  console.error('❌ Erro na função principal:', error);
  process.exit(1);
});
