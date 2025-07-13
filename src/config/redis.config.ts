import { registerAs } from '@nestjs/config';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  keyPrefix: string;
  retryAttempts: number;
  retryDelay: number;
  maxRetriesPerRequest: number;
  lazyConnect: boolean;
  keepAlive: number;
  family: number;
  connectTimeout: number;
  commandTimeout: number;
}

/**
 * Função auxiliar para converter string para número com fallback
 */
const parseIntSafe = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? fallback : parsed;
};

export default registerAs('redis', (): RedisConfig => {
  const config: RedisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseIntSafe(process.env.REDIS_PORT, 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseIntSafe(process.env.REDIS_DB, 0),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'neuralcontent:',
    retryAttempts: parseIntSafe(process.env.REDIS_RETRY_ATTEMPTS, 3),
    retryDelay: parseIntSafe(process.env.REDIS_RETRY_DELAY, 1000),
    maxRetriesPerRequest: parseIntSafe(process.env.REDIS_MAX_RETRIES_PER_REQUEST, 3),
    lazyConnect: process.env.REDIS_LAZY_CONNECT === 'true' || true,
    keepAlive: parseIntSafe(process.env.REDIS_KEEP_ALIVE, 30000),
    family: parseIntSafe(process.env.REDIS_FAMILY, 4),
    connectTimeout: parseIntSafe(process.env.REDIS_CONNECT_TIMEOUT, 10000),
    commandTimeout: parseIntSafe(process.env.REDIS_COMMAND_TIMEOUT, 5000),
  };

  // Log da configuração em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    console.log('🔗 Redis Configuration:', {
      host: config.host,
      port: config.port,
      db: config.db,
      keyPrefix: config.keyPrefix,
      hasPassword: !!config.password,
    });
  }

  return config;
});

/**
 * Configuração do Redis para cache-manager e Redis client
 */
export const getRedisStoreConfig = () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseIntSafe(process.env.REDIS_PORT, 6379),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseIntSafe(process.env.REDIS_DB, 0),
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'neuralcontent:',
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  family: 4,
  connectTimeout: 10000,
  commandTimeout: 5000,
});
