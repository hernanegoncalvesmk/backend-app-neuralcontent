import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Security Middleware - Implementa middlewares de segurança base
 *
 * Features:
 * - Security headers customizados
 * - Rate limiting headers
 * - Log de segurança
 * - Detecção de requests suspeitos
 */
@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  /**
   * Configura middlewares de segurança
   */
  use(req: Request, res: Response, next: NextFunction) {
    // 1. Headers customizados de segurança
    this.setCustomSecurityHeaders(res);

    // 2. Log de segurança
    this.logSecurityInfo(req);

    next();
  }

  /**
   * Define headers customizados de segurança
   */
  private setCustomSecurityHeaders(res: Response): void {
    // API Version
    res.setHeader('X-API-Version', '1.0.0');

    // Powered By (esconder tecnologia)
    res.removeHeader('X-Powered-By');
    res.setHeader('X-Powered-By', 'NeuralContent');

    // Rate Limiting Info
    res.setHeader('X-RateLimit-Limit', '1000');
    res.setHeader('X-RateLimit-Window', '15m');

    // CORS Headers customizados
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Cache Control para APIs
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  /**
   * Log informações de segurança relevantes
   */
  private logSecurityInfo(req: Request): void {
    const securityInfo = {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      origin: req.get('Origin'),
      referer: req.get('Referer'),
      method: req.method,
      url: req.originalUrl,
      timestamp: new Date().toISOString(),
    };

    // Log apenas requests suspeitos ou importantes
    if (this.isSuspiciousRequest(req)) {
      console.warn('🚨 Suspicious request detected:', securityInfo);
    }
  }

  /**
   * Detecta requests potencialmente suspeitos
   */
  private isSuspiciousRequest(req: Request): boolean {
    const suspiciousPatterns = [
      /\.\.\//, // Path traversal
      /script/i, // Script injection
      /union.*select/i, // SQL injection
      /javascript:/i, // XSS
      /<script/i, // XSS
      /eval\(/i, // Code injection
    ];

    const url = req.originalUrl.toLowerCase();
    const userAgent = (req.get('User-Agent') || '').toLowerCase();

    return suspiciousPatterns.some(
      (pattern) => pattern.test(url) || pattern.test(userAgent),
    );
  }
}
