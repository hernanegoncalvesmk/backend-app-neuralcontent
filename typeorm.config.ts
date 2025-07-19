import { DataSource } from 'typeorm';
import { join } from 'path';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || '167.235.253.236',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'app_NeuralContent_8785',
  password: process.env.DB_PASSWORD || 'Jc-0102103',
  database: process.env.DB_DATABASE || 'app_NeuralContent_8785',
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  entities: [join(__dirname, 'src/**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, 'src/database/migrations/*{.ts,.js}')],
  migrationsTableName: 'migrations',
  charset: 'utf8mb4',
  ssl: false,
  extra: {
    acquireTimeout: 60000,
    timeout: 60000,
  },
});

export default AppDataSource;
