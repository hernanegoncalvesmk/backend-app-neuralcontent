import { createConnection } from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

async function cleanTable() {
  const connection = await createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    console.log('🔗 Conectado ao banco de dados');
    
    // Mostrar tabelas criadas
    console.log('\n� Tabelas criadas no banco:');
    const [tables] = await connection.execute('SHOW TABLES');
    if (Array.isArray(tables)) {
      tables.forEach((table: any, index: number) => {
        const tableName = Object.values(table)[0];
        console.log(`  ${index + 1}. ${tableName}`);
      });
    }
    
    // Mostrar migrações executadas
    console.log('\n📈 Migrações executadas:');
    const [migrations] = await connection.execute('SELECT * FROM migrations ORDER BY timestamp');
    if (Array.isArray(migrations)) {
      migrations.forEach((migration: any, index: number) => {
        console.log(`  ${index + 1}. ${migration.name} (${migration.timestamp})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
    console.log('\n🔌 Conexão fechada');
  }
}

cleanTable();
