import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'neuralcontent',
  
  // Entity discovery
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  autoLoadEntities: true,
  
  // Migrations
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  migrationsTableName: 'migrations_history',
  migrationsRun: process.env.NODE_ENV === 'production',
  
  // Development settings
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development' ? 'all' : ['error'],
  
  // Production optimization
  poolSize: parseInt(process.env.DB_POOL_SIZE, 10) || 10,
  acquireTimeout: 60000,
  
  // Charset configuration
  charset: 'utf8mb4',
  
  // Extra options
  extra: {
    connectionLimit: 10,
    acquireTimeout: 60000,
    reconnect: true,
  },
};

// DataSource para migrations
export const AppDataSource = new DataSource({
  ...databaseConfig,
} as DataSourceOptions);
