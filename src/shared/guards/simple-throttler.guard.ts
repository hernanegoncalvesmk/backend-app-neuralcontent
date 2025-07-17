import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { Request, Response } from 'express';

/**
 * Throttler Guard Customizado para Rate Limiting
 * Implementa controle de taxa de requisições por IP e endpoint
 *
 * Características:
 * - Rate limiting por IP
 * - Headers informativos
 * - Logs básicos
 * - Mensagens de erro personalizadas
 */
@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  /**
   * Método executado quando o rate limit é excedido
   */
  protected async throwThrottlingException(
    context: ExecutionContext,
  ): Promise<void> {
    const response = context.switchToHttp().getResponse<Response>();
    const request = context.switchToHttp().getRequest<Request>();

    // Adicionar headers informativos
    response.setHeader(
      'X-RateLimit-Limit',
      process.env.RATE_LIMIT_LIMIT || '10',
    );
    response.setHeader(
      'X-RateLimit-Window',
      process.env.RATE_LIMIT_TTL || '60',
    );
    response.setHeader('Retry-After', process.env.RATE_LIMIT_TTL || '60');

    // Log básico da tentativa de rate limit
    console.warn(
      `Rate limit exceeded - IP: ${this.getClientIp(request)}, Endpoint: ${request.method} ${request.path}`,
    );

    throw new ThrottlerException('Too many requests. Please try again later.');
  }

  /**
   * Extrai o IP real do cliente considerando proxies
   */
  private getClientIp(request: Request): string {
    const xForwardedFor = request.headers['x-forwarded-for'];
    const xRealIp = request.headers['x-real-ip'];
    const cfConnectingIp = request.headers['cf-connecting-ip']; // Cloudflare

    if (typeof xForwardedFor === 'string') {
      return xForwardedFor.split(',')[0].trim();
    }

    if (typeof xRealIp === 'string') {
      return xRealIp;
    }

    if (typeof cfConnectingIp === 'string') {
      return cfConnectingIp;
    }

    return request.ip || request.connection?.remoteAddress || 'unknown';
  }
}
