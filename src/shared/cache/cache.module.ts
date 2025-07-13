import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';

/**
 * Cache Module - Módulo global para gerenciamento de cache
 * 
 * Funcionalidades:
 * - Cache em memória em desenvolvimento
 * - Cache Redis em produção
 * - TTL configurável
 * - Health check do cache
 * - Logs estruturados de cache operations
 */
@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const nodeEnv = process.env.NODE_ENV || 'development';
        
        console.log('📦 Cache Module initializing...');
        console.log('🌍 Environment:', nodeEnv);
        
        if (nodeEnv === 'development') {
          // Em desenvolvimento, usar cache em memória
          console.log('🗄️  Using in-memory cache for development');
          return {
            ttl: 300000, // 5 minutos em milissegundos
            max: 1000,    // máximo de 1000 chaves em cache
          };
        } else {
          // Em produção, tentar usar Redis
          try {
            const redisStore = await import('cache-manager-redis-store');
            const redisHost = process.env.REDIS_HOST || 'localhost';
            const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
            const redisPassword = process.env.REDIS_PASSWORD;
            const redisDb = parseInt(process.env.REDIS_DB || '0', 10);
            const keyPrefix = process.env.REDIS_KEY_PREFIX || 'neuralcontent:';
            
            console.log('🗄️  Using Redis cache for production');
            console.log('🔧 Redis Host:', redisHost);
            console.log('🔧 Redis Port:', redisPort);
            console.log('🔑 Key Prefix:', keyPrefix);
            
            return {
              store: redisStore.default,
              host: redisHost,
              port: redisPort,
              password: redisPassword,
              db: redisDb,
              keyPrefix,
              ttl: 300, // 5 minutos
              max: 1000,
              retryAttempts: 3,
              retryDelay: 1000,
            };
          } catch (error) {
            console.warn('⚠️  Redis não disponível, usando cache em memória');
            return {
              ttl: 300000,
              max: 1000,
            };
          }
        }
      },
      inject: [ConfigService],
    }),
  ],
  providers: [CacheService],
  exports: [NestCacheModule, CacheService],
})
export class CacheModule {
  constructor() {
    console.log('✅ Cache Module initialized successfully');
  }
}
