const { DataSource } = require('typeorm');
const path = require('path');

// Carregar variáveis de ambiente
require('dotenv').config();

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || '167.235.253.236',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'app_NeuralContent_8785',
  password: process.env.DB_PASSWORD || 'Jc-0102103',
  database: process.env.DB_DATABASE || 'app_NeuralContent_8785',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  entities: [path.join(__dirname, 'src/**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, 'src/database/migrations/*{.ts,.js}')],
  migrationsTableName: 'migrations',
  charset: 'utf8mb4',
  ssl: false,
  extra: {
    acquireTimeout: 60000,
    timeout: 60000,
  },
});

async function runMigrations() {
  try {
    console.log('🚀 Conectando ao banco de dados...');
    await AppDataSource.initialize();
    console.log('✅ Conectado ao banco de dados');

    console.log('🔄 Executando migrações...');
    const migrations = await AppDataSource.runMigrations();
    
    if (migrations.length === 0) {
      console.log('ℹ️  Nenhuma migração pendente');
    } else {
      console.log(`✅ ${migrations.length} migração(ões) executada(s) com sucesso:`);
      migrations.forEach((migration, index) => {
        console.log(`  ${index + 1}. ${migration.name}`);
      });
    }

    console.log('🏁 Migrações concluídas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar migrações:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('🔌 Conexão com banco de dados encerrada');
    }
  }
}

runMigrations();
