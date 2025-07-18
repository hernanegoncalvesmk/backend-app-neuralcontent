import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { WinstonLoggerService } from '../logger/winston-logger.service';
import { Request, Response } from 'express';

/**
 * Interceptor simplificado para logging com Winston
 */
@Injectable()
export class SimpleWinstonInterceptor implements NestInterceptor {
  constructor(private readonly winstonLogger: WinstonLoggerService) {
    this.winstonLogger.setContext('HTTP');
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

    // Cria contexto básico da requisição
    const requestContext = {
      method: request.method,
      url: request.originalUrl || request.url,
      ip: request.ip || 'unknown',
      userAgent: request.headers['user-agent'] || 'unknown',
    };

    // Log de início (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      this.winstonLogger.debug(`→ ${request.method} ${request.originalUrl}`, requestContext);
    }

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - startTime;
        const statusCode = response.statusCode;

        // Log HTTP estruturado
        this.winstonLogger.http(
          `${request.method} ${request.originalUrl} - ${statusCode} (${responseTime}ms)`,
          {
            ...requestContext,
            statusCode,
            responseTime,
          }
        );

        // Log de performance para requisições lentas
        if (responseTime > 1000) {
          this.winstonLogger.performance(
            `Slow request: ${request.method} ${request.originalUrl}`,
            responseTime,
            requestContext
          );
        }
      }),
      catchError((error) => {
        const responseTime = Date.now() - startTime;
        const statusCode = error.status || 500;

        // Log de erro
        this.winstonLogger.error(
          `${request.method} ${request.originalUrl} - ${statusCode} (${responseTime}ms)`,
          error.stack,
          {
            ...requestContext,
            statusCode,
            responseTime,
            error: {
              name: error.name,
              message: error.message,
              status: error.status,
            },
          }
        );

        return throwError(() => error);
      }),
    );
  }
}
