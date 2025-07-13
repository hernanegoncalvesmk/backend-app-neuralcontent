import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../guards/roles.guard';

/**
 * Roles Decorator - Define roles necessários para acessar um endpoint
 * 
 * Usage:
 * ```typescript
 * @Roles(UserRole.ADMIN)
 * @Get('admin-only')
 * async adminOnly() {
 *   // Apenas admins podem acessar
 * }
 * 
 * @Roles(UserRole.ADMIN, UserRole.MODERATOR)
 * @Get('moderator-or-admin')
 * async moderatorOrAdmin() {
 *   // Moderators ou admins podem acessar
 * }
 * ```
 * 
 * Features:
 * - Suporte para múltiplos roles
 * - Hierarquia automática (admin > moderator > user)
 * - Type-safe com enum UserRole
 */

export const ROLES_KEY = 'roles';

/**
 * Decorator para definir roles necessários para acessar um endpoint
 * @param roles - Array de roles que podem acessar o endpoint
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
