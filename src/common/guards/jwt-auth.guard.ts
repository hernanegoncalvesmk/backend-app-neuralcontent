import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

/**
 * JWT Authentication Guard
 * Protege rotas que requerem autenticação JWT
 * Nota: Implementação básica - JwtModule será configurado na próxima fase
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Verificar se a rota é pública
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      this.logger.warn('Token JWT não encontrado na requisição');
      throw new UnauthorizedException('Token de acesso requerido');
    }

    // TODO: Implementar validação JWT completa na próxima fase
    // Por enquanto, simular usuário para demonstrar funcionamento
    if (token === 'demo-token') {
      request['user'] = {
        sub: 'demo-user-id',
        email: 'demo@neuralcontent.com',
        role: 'admin',
        iat: Date.now(),
        exp: Date.now() + 3600000,
      };
      
      this.logger.debug('Demo token aceito para desenvolvimento');
      return true;
    }

    this.logger.warn('Token JWT inválido ou não configurado');
    throw new UnauthorizedException('JWT não configurado ainda - use token "demo-token" para teste');
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
