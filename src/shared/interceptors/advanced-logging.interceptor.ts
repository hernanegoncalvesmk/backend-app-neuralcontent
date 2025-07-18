import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { WinstonLoggerService } from '../logger/winston-logger.service';
import { Request, Response } from 'express';

/**
 * Interceptor avançado para logging automático de requisições HTTP
 * Utiliza Winston para logs estruturados e rotação de arquivos
 */
@Injectable()
export class AdvancedLoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject('WINSTON_LOGGER')
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext('HTTP');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const contextType = context.getType();

    // Só processa requisições HTTP
    if (contextType !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;

    // Cria contexto da requisição
    const requestContext = this.logger.createRequestContext(request);
    const { method, url } = request;

    // Log de início da requisição (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(`➡️  ${method} ${url}`, {
        ...requestContext,
        metadata: {
          headers: this.sanitizeHeaders(request.headers),
          query: request.query,
          params: request.params,
          body: this.sanitizeBody(request.body),
        },
      });
    }

    return next.handle().pipe(
      tap((responseData) => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        const endMemory = process.memoryUsage().heapUsed;
        const memoryDelta = endMemory - startMemory;

        // Contexto da resposta
        const responseContext = {
          ...requestContext,
          statusCode: response.statusCode,
          responseTime,
          performance: {
            duration: responseTime,
            memory: memoryDelta,
            cpu: 0, // Seria necessário um cálculo mais complexo
          },
        };

        // Log HTTP estruturado
        this.logger.http(`✅ ${method} ${url}`, responseContext);

        // Log de performance para requisições lentas
        if (responseTime > 1000) {
          this.logger.performance(
            `⚠️  Slow request: ${method} ${url} (${responseTime}ms)`,
            responseTime,
            {
              ...responseContext,
              metadata: {
                threshold: 1000,
                severity: responseTime > 5000 ? 'critical' : 'warning',
              },
            },
          );
        }

        // Log de métricas para análise
        this.logger.metric('http_request_duration', responseTime, 'ms', {
          method,
          url,
          statusCode: response.statusCode,
        });

        // Log detalhado apenas em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
          this.logger.debug(`📊 Request metrics`, {
            ...responseContext,
            metadata: {
              responseSize: responseData ? JSON.stringify(responseData).length : 0,
              memoryUsage: this.formatBytes(memoryDelta),
              headers: response.getHeaders(),
            },
          });
        }
      }),
      catchError((error) => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        const endMemory = process.memoryUsage().heapUsed;
        const memoryDelta = endMemory - startMemory;

        const errorContext = {
          ...requestContext,
          statusCode: error.status || 500,
          responseTime,
          performance: {
            duration: responseTime,
            memory: memoryDelta,
            cpu: 0,
          },
          error: {
            name: error.name,
            message: error.message,
            status: error.status,
            code: error.code,
          },
        };

        // Log de erro HTTP
        this.logger.http(`❌ ${method} ${url}`, errorContext);

        // Log de erro detalhado
        this.logger.logError(error, {
          ...errorContext,
          metadata: {
            requestBody: this.sanitizeBody(request.body),
            requestQuery: request.query,
            requestParams: request.params,
          },
        });

        // Log de segurança para tentativas suspeitas
        if (this.isSuspiciousRequest(request, error)) {
          this.logger.security(
            `🚨 Suspicious activity: ${method} ${url} - ${error.message}`,
            {
              ...errorContext,
              metadata: {
                suspicionReasons: this.getSuspicionReasons(request, error),
                ipAddress: request.ip,
                userAgent: request.headers['user-agent'],
              },
            },
          );
        }

        // Métrica de erro
        this.logger.metric('http_request_errors', 1, 'count', {
          method,
          url,
          statusCode: error.status || 500,
          metadata: {
            errorType: error.name,
          },
        });

        return throwError(() => error);
      }),
    );
  }

  /**
   * Remove dados sensíveis dos headers
   */
  private sanitizeHeaders(headers: Record<string, any>): Record<string, any> {
    const sanitized = { ...headers };
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'x-api-key',
      'x-auth-token',
      'x-access-token',
    ];

    sensitiveHeaders.forEach((header) => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Remove dados sensíveis do body da requisição
   */
  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sanitized = { ...body };
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'creditCard',
      'ssn',
      'cpf',
    ];

    const sanitizeObject = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;
      
      const result: any = Array.isArray(obj) ? [] : {};
      
      for (const [key, value] of Object.entries(obj)) {
        if (sensitiveFields.some(field => 
          key.toLowerCase().includes(field.toLowerCase())
        )) {
          result[key] = '[REDACTED]';
        } else if (typeof value === 'object') {
          result[key] = sanitizeObject(value);
        } else {
          result[key] = value;
        }
      }
      
      return result;
    };

    return sanitizeObject(sanitized);
  }

  /**
   * Identifica requisições suspeitas
   */
  private isSuspiciousRequest(request: Request, error: any): boolean {
    const suspiciousPatterns = [
      /\.\./,           // Path traversal
      /<script/i,       // XSS attempts
      /union.*select/i, // SQL injection
      /exec\s*\(/i,     // Code injection
      /eval\s*\(/i,     // Code injection
    ];

    const url = request.url.toLowerCase();
    const userAgent = (request.headers['user-agent'] || '').toLowerCase();
    
    // Verifica padrões suspeitos na URL
    if (suspiciousPatterns.some(pattern => pattern.test(url))) {
      return true;
    }

    // Verifica user-agent suspeito
    if (userAgent.includes('sqlmap') || 
        userAgent.includes('nmap') || 
        userAgent.includes('scanner')) {
      return true;
    }

    // Verifica múltiplas tentativas de autenticação falhadas
    if (error.status === 401 && request.url.includes('/auth/')) {
      return true;
    }

    // Verifica tentativas de acesso a recursos protegidos
    if (error.status === 403 && !request.headers.authorization) {
      return true;
    }

    return false;
  }

  /**
   * Obtém razões específicas de suspeita
   */
  private getSuspicionReasons(request: Request, error: any): string[] {
    const reasons: string[] = [];

    if (/\.\./.test(request.url)) {
      reasons.push('Path traversal attempt');
    }

    if (/<script/i.test(request.url)) {
      reasons.push('XSS attempt in URL');
    }

    if (/union.*select/i.test(request.url)) {
      reasons.push('SQL injection attempt');
    }

    const userAgent = (request.headers['user-agent'] || '').toLowerCase();
    if (userAgent.includes('sqlmap') || userAgent.includes('nmap')) {
      reasons.push('Suspicious user agent');
    }

    if (error.status === 401 && request.url.includes('/auth/')) {
      reasons.push('Multiple authentication failures');
    }

    if (error.status === 403) {
      reasons.push('Unauthorized access attempt');
    }

    return reasons;
  }

  /**
   * Formata bytes para formato legível
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
}
