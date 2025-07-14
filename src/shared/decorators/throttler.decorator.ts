import { SetMetadata } from '@nestjs/common';

/**
 * Chave para metadados do throttler customizado
 */
export const THROTTLER_CUSTOM_KEY = 'throttler_custom';

/**
 * Interface para configuração de throttler por endpoint
 */
export interface ThrottlerCustomConfig {
  ttl?: number;     // Time to live em segundos
  limit?: number;   // Número máximo de requisições
  skipIf?: (req: any) => boolean; // Função para pular throttling
}

/**
 * Decorador para configurar rate limiting customizado por endpoint
 * 
 * @param config Configuração customizada do throttler
 * 
 * @example
 * // Rate limiting rigoroso para login
 * @ThrottlerCustom({ ttl: 60, limit: 3 })
 * @Post('login')
 * async login() {}
 * 
 * @example
 * // Rate limiting flexível para listagem
 * @ThrottlerCustom({ ttl: 60, limit: 100 })
 * @Get('users')
 * async findAll() {}
 * 
 * @example
 * // Pular throttling para usuários autenticados
 * @ThrottlerCustom({ 
 *   ttl: 60, 
 *   limit: 10,
 *   skipIf: (req) => !!req.user 
 * })
 * @Get('public-data')
 * async getPublicData() {}
 */
export const ThrottlerCustom = (config: ThrottlerCustomConfig) =>
  SetMetadata(THROTTLER_CUSTOM_KEY, config);

/**
 * Decorador para pular rate limiting completamente
 * 
 * @example
 * @SkipThrottling()
 * @Get('health')
 * async healthCheck() {}
 */
export const SkipThrottling = () =>
  SetMetadata(THROTTLER_CUSTOM_KEY, { skipIf: () => true });

/**
 * Decorador para rate limiting rigoroso (ideal para endpoints críticos)
 * 
 * @example
 * @StrictThrottling()
 * @Post('reset-password')
 * async resetPassword() {}
 */
export const StrictThrottling = () =>
  SetMetadata(THROTTLER_CUSTOM_KEY, { ttl: 300, limit: 1 }); // 1 requisição a cada 5 minutos

/**
 * Decorador para rate limiting moderado (ideal para APIs públicas)
 * 
 * @example
 * @ModerateThrottling()
 * @Get('public-api')
 * async getPublicData() {}
 */
export const ModerateThrottling = () =>
  SetMetadata(THROTTLER_CUSTOM_KEY, { ttl: 60, limit: 30 }); // 30 requisições por minuto

/**
 * Decorador para rate limiting flexível (ideal para usuários autenticados)
 * 
 * @example
 * @FlexibleThrottling()
 * @Get('user-data')
 * async getUserData() {}
 */
export const FlexibleThrottling = () =>
  SetMetadata(THROTTLER_CUSTOM_KEY, { ttl: 60, limit: 100 }); // 100 requisições por minuto
