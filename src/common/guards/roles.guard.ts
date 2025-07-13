import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}

/**
 * Roles Guard
 * Protege rotas baseado em roles de usuário
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Buscar roles requeridas pelos decorators
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // Sem restrição de roles
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn('Tentativa de acesso sem usuário autenticado');
      throw new ForbiddenException('Usuário não autenticado');
    }

    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      this.logger.warn(
        `Usuário ${user.sub} tentou acessar recurso que requer roles: ${requiredRoles.join(', ')}. Usuário tem role: ${user.role}`,
      );
      throw new ForbiddenException(
        `Acesso negado. Roles requeridas: ${requiredRoles.join(', ')}`,
      );
    }

    this.logger.debug(`Acesso autorizado para usuário ${user.sub} com role ${user.role}`);
    return true;
  }
}
