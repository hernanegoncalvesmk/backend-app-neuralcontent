import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { LoggerService } from '../logger/logger.service';

/**
 * Interceptor global para logging automático de requisições
 * Captura todas as requisições HTTP e seus resultados
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext('HTTP');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const contextType = context.getType();

    // Só processa requisições HTTP
    if (contextType !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    // Cria contexto da requisição
    const requestContext = this.logger.createRequestContext(request);

    // Log de início da requisição (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(`Incoming request: ${request.method} ${request.url}`, {
        ...requestContext,
        metadata: {
          headers: this.sanitizeHeaders(request.headers),
          query: request.query,
          params: request.params,
        },
      });
    }

    return next.handle().pipe(
      tap((data) => {
        const responseTime = Date.now() - startTime;

        // Log de sucesso da requisição
        this.logger.logRequest(request, response, responseTime);

        // Log de performance para requisições lentas (>1s)
        if (responseTime > 1000) {
          this.logger.performance(
            `Slow request detected: ${request.method} ${request.url}`,
            responseTime,
            requestContext,
          );
        }

        // Log detalhado em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
          this.logger.debug(`Request completed successfully`, {
            ...requestContext,
            responseTime,
            statusCode: response.statusCode,
            metadata: {
              dataType: typeof data,
              dataSize: data ? JSON.stringify(data).length : 0,
            },
          });
        }
      }),
      catchError((error) => {
        const responseTime = Date.now() - startTime;

        // Log de erro da requisição
        this.logger.error(
          `Request failed: ${request.method} ${request.url}`,
          error.stack,
          {
            ...requestContext,
            responseTime,
            statusCode: error.status || 500,
            error: {
              name: error.name,
              message: error.message,
              status: error.status,
            },
          },
        );

        // Log de segurança para tentativas suspeitas
        if (this.isSuspiciousRequest(request, error)) {
          this.logger.security(
            `Suspicious request detected: ${error.message}`,
            {
              ...requestContext,
              error: {
                name: error.name,
                message: error.message,
                status: error.status,
              },
            },
          );
        }

        return throwError(() => error);
      }),
    );
  }

  /**
   * Remove headers sensíveis do log
   */
  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };

    // Lista de headers que devem ser removidos ou mascarados
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'set-cookie',
      'x-api-key',
      'x-auth-token',
    ];

    sensitiveHeaders.forEach((header) => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Detecta requisições potencialmente suspeitas
   */
  private isSuspiciousRequest(request: any, error: any): boolean {
    // Múltiplas tentativas de autenticação falhadas
    if (error.status === 401 && request.url.includes('/auth/')) {
      return true;
    }

    // Tentativas de acesso a endpoints não autorizados
    if (error.status === 403) {
      return true;
    }

    // Requisições com payloads muito grandes
    if (
      request.headers['content-length'] &&
      parseInt(request.headers['content-length']) > 10 * 1024 * 1024
    ) {
      // 10MB
      return true;
    }

    // Tentativas de SQL injection ou XSS nos parâmetros
    const suspiciousPatterns = [
      /(\b(union|select|insert|delete|update|drop|create|alter)\b)/i,
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/i,
      /vbscript:/i,
    ];

    const urlToCheck = `${request.url} ${JSON.stringify(request.query)} ${JSON.stringify(request.body)}`;

    return suspiciousPatterns.some((pattern) => pattern.test(urlToCheck));
  }
}
