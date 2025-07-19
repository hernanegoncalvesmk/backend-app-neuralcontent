import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config();

async function runMigrations() {
  console.log('🚀 Iniciando execução das migrações...');

  // Configurar DataSource
  const AppDataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || '167.235.253.236',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USERNAME || 'app_NeuralContent_8785',
    password: process.env.DB_PASSWORD || 'Jc-0102103',
    database: process.env.DB_DATABASE || 'app_NeuralContent_8785',
    synchronize: false,
    logging: true,
    entities: ['src/**/*.entity{.ts,.js}'],
    migrations: ['src/database/migrations/*{.ts,.js}'],
    migrationsTableName: 'migrations',
    charset: 'utf8mb4',
    ssl: false,
  });

  try {
    console.log('🔗 Conectando ao banco de dados...');
    await AppDataSource.initialize();
    console.log('✅ Conectado com sucesso!');

    console.log('📋 Verificando migrações pendentes...');
    const hasPendingMigrations = await AppDataSource.showMigrations();
    console.log(`📊 Há migrações pendentes: ${hasPendingMigrations ? 'Sim' : 'Não'}`);

    if (hasPendingMigrations) {
      console.log('⚡ Executando migrações...');
      const executedMigrations = await AppDataSource.runMigrations();
      
      console.log(`✅ ${executedMigrations.length} migração(ões) executada(s) com sucesso:`);
      executedMigrations.forEach((migration, index) => {
        console.log(`  ${index + 1}. ${migration.name}`);
      });
    } else {
      console.log('ℹ️ Todas as migrações já foram executadas');
    }

    console.log('🎉 Processo concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante a execução:', error);
    console.error('🔍 Stack trace:', error.stack);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('🔌 Conexão encerrada');
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('💥 Falha crítica:', error);
      process.exit(1);
    });
}

export { runMigrations };
