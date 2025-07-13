import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Logging Interceptor
 * Registra informações de requests e responses para monitoramento
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url, body, query, params } = request;
    const userAgent = request.get('User-Agent') || 'Unknown';
    const clientIp = request.ip || request.connection.remoteAddress || 'Unknown';

    const startTime = Date.now();

    // Log da requisição recebida
    this.logger.log(`🔄 ${method} ${url}`, {
      userAgent,
      clientIp,
      body: this.sanitizeBody(body),
      query,
      params,
      userId: request.user?.sub,
    });

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;
          
          this.logger.log(`✅ ${method} ${url} - ${statusCode} - ${duration}ms`, {
            statusCode,
            duration,
            responseSize: JSON.stringify(data).length,
            userId: request.user?.sub,
          });
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode || 500;
          
          this.logger.error(`❌ ${method} ${url} - ${statusCode} - ${duration}ms`, {
            error: error.message,
            stack: error.stack,
            statusCode,
            duration,
            userId: request.user?.sub,
          });
        },
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sanitized = { ...body };
    
    // Remover campos sensíveis dos logs
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard'];
    
    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    });

    return sanitized;
  }
}
