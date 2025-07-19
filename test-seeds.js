#!/usr/bin/env node

/**
 * Script de teste para validar o sistema de seeds
 * 
 * @description Testa se todos os seeds podem ser executados sem erros
 * @usage npm run db:seed:test
 */

require('dotenv').config();

const { DataSource } = require('typeorm');
const { SeedRunner } = require('./dist/src/database/seeds/run-seeds');

async function testSeeds() {
  console.log('🧪 Iniciando teste do sistema de seeds...');
  console.log('==========================================');

  let dataSource;

  try {
    // Configuração do banco de dados
    const config = {
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'neuralcontent',
      entities: ['dist/src/**/*.entity.js'],
      migrations: ['dist/src/database/migrations/*.js'],
      synchronize: false,
      logging: true,
    };

    console.log('🔌 Conectando ao banco de dados...');
    dataSource = new DataSource(config);
    await dataSource.initialize();
    console.log('✅ Conexão estabelecida com sucesso!');

    // Executar seeds
    console.log('\n🌱 Executando seeds...');
    const seedRunner = new SeedRunner(dataSource);
    await seedRunner.run();

    console.log('\n🎉 Teste concluído com sucesso!');
    console.log('==========================================');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
    process.exit(1);
  } finally {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('🔌 Conexão com banco de dados encerrada.');
    }
  }
}

testSeeds().catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
