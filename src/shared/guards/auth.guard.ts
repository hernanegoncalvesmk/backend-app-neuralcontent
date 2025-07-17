import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Authentication Guard - Guard de autenticação JWT
 *
 * Features:
 * - Verificação de token JWT
 * - Suporte para rotas públicas (@Public decorator)
 * - Extração de usuário do token
 * - Validação de formato do token
 * - Log de tentativas de acesso
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Verificar se é uma rota pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // 2. Extrair request e token
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      this.logFailedAttempt(request, 'No token provided');
      throw new UnauthorizedException('Token de acesso não fornecido');
    }

    try {
      // 3. Verificar e decodificar token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      // 4. Validar payload
      if (!payload || !payload.sub || !payload.email) {
        this.logFailedAttempt(request, 'Invalid token payload');
        throw new UnauthorizedException('Token inválido');
      }

      // 5. Adicionar usuário ao request
      request['user'] = {
        id: payload.sub,
        email: payload.email,
        role: payload.role || 'user',
        name: payload.name,
        status: payload.status,
        iat: payload.iat,
        exp: payload.exp,
      };

      // 6. Log acesso bem-sucedido
      this.logSuccessfulAccess(request, payload.sub);

      return true;
    } catch (error) {
      this.logFailedAttempt(
        request,
        `Token verification failed: ${error.message}`,
      );

      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token expirado');
      }

      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Token malformado');
      }

      throw new UnauthorizedException('Token inválido');
    }
  }

  /**
   * Extrai token do header Authorization
   */
  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  /**
   * Log tentativas de acesso malsucedidas
   */
  private logFailedAttempt(request: Request, reason: string): void {
    const logData = {
      ip: request.ip || request.connection.remoteAddress,
      userAgent: request.get('User-Agent'),
      method: request.method,
      url: request.originalUrl,
      reason,
      timestamp: new Date().toISOString(),
    };

    console.warn('🔒 Failed authentication attempt:', logData);
  }

  /**
   * Log acessos bem-sucedidos
   */
  private logSuccessfulAccess(request: Request, userId: string): void {
    const logData = {
      userId,
      ip: request.ip || request.connection.remoteAddress,
      method: request.method,
      url: request.originalUrl,
      timestamp: new Date().toISOString(),
    };

    console.log('✅ Successful authentication:', logData);
  }
}
