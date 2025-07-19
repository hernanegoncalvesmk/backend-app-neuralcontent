import AppDataSource from './src/database/data-source';

async function cleanDatabase() {
  try {
    await AppDataSource.initialize();
    console.log('🔗 Conectado ao banco de dados');
    
    // Verificar se a tabela existe e removê-la
    const tables = await AppDataSource.query('SHOW TABLES LIKE "crd_credit_transactions"');
    if (tables.length > 0) {
      console.log('🗑️ Removendo tabela crd_credit_transactions...');
      await AppDataSource.query('SET FOREIGN_KEY_CHECKS = 0');
      await AppDataSource.query('DROP TABLE IF EXISTS crd_credit_transactions');
      await AppDataSource.query('SET FOREIGN_KEY_CHECKS = 1');
      console.log('✅ Tabela removida com sucesso');
    } else {
      console.log('ℹ️ Tabela crd_credit_transactions não existe');
    }
    
    await AppDataSource.destroy();
    console.log('🔌 Conexão fechada');
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

cleanDatabase();
