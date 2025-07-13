import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from './roles.guard';

/**
 * Admin Guard
 * Protege rotas que requerem privilégios administrativos
 */
@Injectable()
export class AdminGuard implements CanActivate {
  private readonly logger = new Logger(AdminGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn('Tentativa de acesso admin sem usuário autenticado');
      throw new ForbiddenException('Usuário não autenticado');
    }

    const isAdmin = user.role === UserRole.ADMIN;

    if (!isAdmin) {
      this.logger.warn(
        `Usuário ${user.sub} (${user.email}) tentou acessar área administrativa sem privilégios`,
      );
      throw new ForbiddenException('Acesso negado. Privilégios administrativos requeridos');
    }

    this.logger.debug(`Acesso administrativo autorizado para usuário ${user.sub}`);
    return true;
  }
}
