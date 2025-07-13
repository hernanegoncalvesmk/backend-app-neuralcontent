import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Roles Guard - Guard de autorização baseado em roles
 * 
 * Features:
 * - Verificação de roles do usuário
 * - Suporte para múltiplos roles por endpoint
 * - Log de tentativas de acesso negado
 * - Validação hierárquica de permissões
 */

export enum UserRole {
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
}

/**
 * Hierarquia de roles (do menor para o maior privilégio)
 */
const ROLE_HIERARCHY = {
  [UserRole.USER]: 1,
  [UserRole.MODERATOR]: 2,
  [UserRole.ADMIN]: 3,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Obter roles requeridos do decorator
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 2. Se não há roles requeridos, permitir acesso
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 3. Obter usuário do request
    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      this.logAccessDenied(context, 'No user in request');
      throw new ForbiddenException('Usuário não autenticado');
    }

    // 4. Verificar se o usuário tem pelo menos um dos roles requeridos
    const hasRequiredRole = this.checkUserRoles(user.role, requiredRoles);

    if (!hasRequiredRole) {
      this.logAccessDenied(context, `User role ${user.role} insufficient for required roles: ${requiredRoles.join(', ')}`);
      throw new ForbiddenException('Permissões insuficientes para acessar este recurso');
    }

    // 5. Log acesso autorizado
    this.logAuthorizedAccess(context, user.id, user.role);

    return true;
  }

  /**
   * Verifica se o role do usuário atende aos requisitos
   * Usa hierarquia de roles para permitir que roles superiores acessem recursos de roles inferiores
   */
  private checkUserRoles(userRole: string, requiredRoles: UserRole[]): boolean {
    const userRoleLevel = ROLE_HIERARCHY[userRole as UserRole];
    
    if (!userRoleLevel) {
      return false;
    }

    // Verificar se o nível do usuário é suficiente para qualquer um dos roles requeridos
    return requiredRoles.some(requiredRole => {
      const requiredLevel = ROLE_HIERARCHY[requiredRole];
      return userRoleLevel >= requiredLevel;
    });
  }

  /**
   * Log acesso negado
   */
  private logAccessDenied(context: ExecutionContext, reason: string): void {
    const request = context.switchToHttp().getRequest();
    const logData = {
      ip: request.ip || request.connection.remoteAddress,
      userId: request.user?.id,
      userRole: request.user?.role,
      method: request.method,
      url: request.originalUrl,
      reason,
      timestamp: new Date().toISOString(),
    };

    console.warn('🚫 Access denied by RolesGuard:', logData);
  }

  /**
   * Log acesso autorizado
   */
  private logAuthorizedAccess(context: ExecutionContext, userId: string, userRole: string): void {
    const request = context.switchToHttp().getRequest();
    const logData = {
      userId,
      userRole,
      method: request.method,
      url: request.originalUrl,
      timestamp: new Date().toISOString(),
    };

    console.log('✅ Access authorized by RolesGuard:', logData);
  }
}
