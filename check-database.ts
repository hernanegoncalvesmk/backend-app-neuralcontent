import AppDataSource from './src/database/data-source';

async function showTables() {
  try {
    await AppDataSource.initialize();
    console.log('📊 Tabelas criadas no banco:');
    
    const tables = await AppDataSource.query('SHOW TABLES');
    tables.forEach((table: any, index: number) => {
      const tableName = Object.values(table)[0];
      console.log(`  ${index + 1}. ${tableName}`);
    });
    
    console.log('\n📈 Status das migrações:');
    const migrations = await AppDataSource.query('SELECT * FROM migrations ORDER BY timestamp');
    migrations.forEach((migration: any, index: number) => {
      console.log(`  ${index + 1}. ${migration.name} (${migration.timestamp})`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await AppDataSource.destroy();
  }
}

showTables();
