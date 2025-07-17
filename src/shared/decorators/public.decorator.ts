import { SetMetadata } from '@nestjs/common';

/**
 * Public Decorator - Marca rotas como públicas (sem autenticação)
 *
 * Usage:
 * ```typescript
 * @Public()
 * @Get('login')
 * async login() {
 *   // Esta rota não requer autenticação
 * }
 * ```
 *
 * Features:
 * - Bypass do AuthGuard
 * - Usado para endpoints de login, registro, etc.
 * - Suporte para classes e métodos
 */

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator para marcar rotas como públicas
 * Rotas marcadas com @Public() não passarão pelo AuthGuard
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
