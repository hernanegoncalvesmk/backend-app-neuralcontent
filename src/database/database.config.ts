import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'neuralcontent',

    // Entity configurations
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
    subscribers: [__dirname + '/../database/subscribers/*{.ts,.js}'],

    // Development settings
    synchronize: process.env.NODE_ENV === 'development',
    logging:
      process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
    logger: 'advanced-console',

    // Connection pool settings
    extra: {
      connectionLimit: 10,
      acquireTimeout: 60000,
      timeout: 60000,
    },

    // Production optimizations
    cache: {
      duration: 30000, // 30 seconds
    },

    // Timezone configuration
    timezone: 'Z',

    // Connection options
    charset: 'utf8mb4',
    supportBigNumbers: true,
    bigNumberStrings: false,

    // Retry configuration
    retryAttempts: 3,
    retryDelay: 3000,
    autoLoadEntities: true,
  }),
);
