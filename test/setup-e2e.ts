/**
 * Setup para testes E2E
 * Configurações específicas para testes de integração
 */

import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// Configuração de environment para testes E2E
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  'mysql://test:test@localhost:3306/neuralcontent_test';
process.env.REDIS_URL = 'redis://localhost:6379/1';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';

// Configuração global para testes E2E
(global as any).testConfig = {
  database: {
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'test',
    password: 'test',
    database: 'neuralcontent_test',
    entities: ['src/**/*.entity.ts'],
    synchronize: true,
    dropSchema: true,
    logging: false,
  },
  redis: {
    host: 'localhost',
    port: 6379,
    db: 1,
  },
  jwt: {
    secret: 'test-jwt-secret-key',
    expiresIn: '15m',
    refreshSecret: 'test-refresh-secret-key',
    refreshExpiresIn: '7d',
  },
};

// Helper para limpeza do banco de dados entre testes
export const cleanDatabase = async (connection: any) => {
  const entities = connection.entityMetadatas;

  for (const entity of entities) {
    const repository = connection.getRepository(entity.name);
    await repository.query(`DELETE FROM ${entity.tableName}`);
  }
};

// Helper para criar usuário de teste
export const createTestUser = () => ({
  id: 1,
  email: 'test@neuralcontent.com',
  name: 'Test User',
  password: 'hashedPassword123',
  role: 'user',
  isActive: true,
  isEmailVerified: true,
  credits: 100,
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Helper para criar token JWT de teste
export const createTestJWT = () => ({
  access_token: 'test-jwt-token',
  refresh_token: 'test-refresh-token',
  expires_in: 900,
  token_type: 'Bearer',
});

// Mock de serviços externos para testes E2E
export const mockExternalServices = {
  stripe: {
    customers: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
    paymentIntents: {
      create: jest.fn(),
      confirm: jest.fn(),
    },
  },
  paypal: {
    orders: {
      create: jest.fn(),
      capture: jest.fn(),
    },
  },
  email: {
    send: jest.fn(),
  },
};

// Timeout para testes E2E mais longos
jest.setTimeout(60000);
