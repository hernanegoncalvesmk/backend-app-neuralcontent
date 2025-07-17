import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

/**
 * Cache Service - Serviço para operações avançadas de cache
 *
 * Funcionalidades:
 * - Get/Set com TTL customizável
 * - Operações batch
 * - Cache invalidation patterns
 * - Métricas de cache (hit/miss)
 * - Health check do Redis
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private cacheHits = 0;
  private cacheMisses = 0;

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Obter valor do cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.cacheManager.get<T>(key);

      if (value !== null && value !== undefined) {
        this.cacheHits++;
        this.logger.debug(`Cache HIT for key: ${key}`);
        return value;
      } else {
        this.cacheMisses++;
        this.logger.debug(`Cache MISS for key: ${key}`);
        return null;
      }
    } catch (error) {
      this.logger.error(`Cache GET error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Definir valor no cache com TTL opcional
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
      this.logger.debug(
        `Cache SET for key: ${key}${ttl ? ` (TTL: ${ttl}s)` : ''}`,
      );
    } catch (error) {
      this.logger.error(`Cache SET error for key ${key}:`, error);
    }
  }

  /**
   * Deletar chave específica do cache
   */
  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache DEL for key: ${key}`);
    } catch (error) {
      this.logger.error(`Cache DEL error for key ${key}:`, error);
    }
  }

  /**
   * Limpar todo o cache
   */
  async clear(): Promise<void> {
    try {
      // Para cache-manager, usar o método store específico
      const store = (this.cacheManager as any).store;
      if (store && store.reset) {
        await store.reset();
      }
      this.logger.warn('Cache CLEARED - All keys removed');
    } catch (error) {
      this.logger.error('Cache CLEAR error:', error);
    }
  }

  /**
   * Get ou Set - busca no cache, se não existir executa função e salva
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    try {
      // Tentar buscar no cache primeiro
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      // Se não existe, executar factory function
      const value = await factory();

      // Salvar no cache
      await this.set(key, value, ttl);

      return value;
    } catch (error) {
      this.logger.error(`Cache getOrSet error for key ${key}:`, error);
      // Em caso de erro, executar factory function sem cache
      return await factory();
    }
  }

  /**
   * Invalidar cache por padrão (ex: user:*)
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      // Para cache-manager-redis-store, precisamos usar keys pattern
      // Esta é uma operação custosa, usar com cuidado
      this.logger.warn(`Cache pattern invalidation: ${pattern}`);
      // Implementação específica dependeria da versão do cache-manager-redis-store
      // Por enquanto, log de warning
    } catch (error) {
      this.logger.error(
        `Cache pattern invalidation error for ${pattern}:`,
        error,
      );
    }
  }

  /**
   * Verificar saúde do Redis
   */
  async healthCheck(): Promise<{
    isConnected: boolean;
    responseTime?: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      // Teste simples de conectividade
      const testKey = 'health_check_test';
      const testValue = Date.now().toString();

      await this.set(testKey, testValue, 1); // TTL de 1 segundo
      const retrieved = await this.get(testKey);

      const responseTime = Date.now() - startTime;

      if (retrieved === testValue) {
        return {
          isConnected: true,
          responseTime,
        };
      } else {
        return {
          isConnected: false,
          error: 'Value mismatch in health check',
        };
      }
    } catch (error) {
      return {
        isConnected: false,
        error: error.message,
      };
    }
  }

  /**
   * Obter métricas do cache
   */
  getMetrics() {
    const total = this.cacheHits + this.cacheMisses;
    const hitRatio = total > 0 ? (this.cacheHits / total) * 100 : 0;

    return {
      hits: this.cacheHits,
      misses: this.cacheMisses,
      total,
      hitRatio: Math.round(hitRatio * 100) / 100, // 2 casas decimais
    };
  }

  /**
   * Reset das métricas
   */
  resetMetrics(): void {
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.logger.debug('Cache metrics reset');
  }
}
