import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  RequestTimeoutException,
} from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

/**
 * Timeout Interceptor
 * Aplica timeout global para todas as requisições
 */
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  private readonly defaultTimeout = 30000; // 30 segundos

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    // Timeout customizado via header ou configuração de rota
    const customTimeout = request.headers['x-timeout'] || this.defaultTimeout;
    const timeoutValue = parseInt(customTimeout.toString(), 10);

    return next.handle().pipe(
      timeout(timeoutValue),
      catchError((error) => {
        if (error instanceof TimeoutError) {
          return throwError(
            () =>
              new RequestTimeoutException(
                `A operação excedeu o tempo limite de ${timeoutValue}ms`,
              ),
          );
        }
        return throwError(() => error);
      }),
    );
  }
}
