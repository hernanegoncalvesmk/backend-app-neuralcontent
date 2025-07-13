import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
  path: string;
  method: string;
  statusCode: number;
}

/**
 * Transform Interceptor
 * Padroniza todas as respostas da API em um formato consistente
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        message: this.getSuccessMessage(request.method),
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        statusCode: response.statusCode,
      })),
    );
  }

  private getSuccessMessage(method: string): string {
    const messages = {
      GET: 'Dados recuperados com sucesso',
      POST: 'Recurso criado com sucesso',
      PUT: 'Recurso atualizado com sucesso',
      PATCH: 'Recurso atualizado com sucesso',
      DELETE: 'Recurso removido com sucesso',
    };

    return messages[method] || 'Operação realizada com sucesso';
  }
}
