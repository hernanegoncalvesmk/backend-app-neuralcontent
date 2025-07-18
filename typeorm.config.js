const { DataSource } = require('typeorm');
require('dotenv').config();

module.exports = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'neuralcontent',

  // Entity and migration paths
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/database/migrations/*{.ts,.js}'],
  subscribers: ['src/database/subscribers/*{.ts,.js}'],

  // Development settings
  synchronize: false, // Always false for CLI operations
  logging: ['error'],

  // Connection settings
  charset: 'utf8mb4',
  timezone: 'Z',
  supportBigNumbers: true,
  bigNumberStrings: false,

  // Migration settings
  migrationsRun: false,
  migrationsTableName: 'migrations',
});
