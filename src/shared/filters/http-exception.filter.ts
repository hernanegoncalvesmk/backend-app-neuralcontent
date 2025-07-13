import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../logger/logger.service';
import { BaseCustomException } from '../exceptions/custom.exceptions';

/**
 * Interface para resposta padronizada de erro
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
    timestamp: string;
    path: string;
    method: string;
    requestId?: string;
    details?: any;
    stack?: string;
  };
  meta: {
    version: string;
    documentation: string;
    support: string;
  };
}

/**
 * Filtro para capturar e tratar exceções HTTP
 * Fornece respostas estruturadas e logging detalhado
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext('HttpExceptionFilter');
  }

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    // Gerar ID único para a requisição (se não existir)
    const requestId = (request as any).id || this.generateRequestId();

    // Extrair contexto da requisição
    const requestContext = this.extractRequestContext(request);

    // Construir resposta de erro estruturada
    const errorResponse = this.buildErrorResponse(
      exception,
      status,
      requestContext,
      requestId
    );

    // Log do erro baseado na severidade
    this.logError(exception, errorResponse, requestContext);

    // Enviar resposta
    response.status(status).json(errorResponse);
  }

  /**
   * Extrai contexto relevante da requisição
   */
  private extractRequestContext(request: Request) {
    return {
      path: request.url,
      method: request.method,
      userAgent: request.get('user-agent'),
      ip: this.getClientIp(request),
      userId: (request as any).user?.id,
      sessionId: (request as any).sessionId,
      query: Object.keys(request.query).length > 0 ? request.query : undefined,
      params: Object.keys(request.params).length > 0 ? request.params : undefined,
    };
  }

  /**
   * Constrói resposta de erro estruturada
   */
  private buildErrorResponse(
    exception: HttpException,
    status: number,
    requestContext: any,
    requestId: string
  ): ErrorResponse {
    const exceptionResponse = exception.getResponse();
    const message = this.extractErrorMessage(exceptionResponse);
    const code = this.generateErrorCode(exception, status);

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code,
        message,
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: requestContext.path,
        method: requestContext.method,
        requestId,
      },
      meta: {
        version: '1.0.0',
        documentation: 'https://api.neuralbook.app/docs',
        support: 'support@neuralbook.app',
      },
    };

    // Adicionar detalhes extras para exceções customizadas
    if (exception instanceof BaseCustomException) {
      errorResponse.error.details = this.extractCustomExceptionDetails(exception);
    }

    // Adicionar detalhes de validação para erros 400
    if (status === HttpStatus.BAD_REQUEST && typeof exceptionResponse === 'object') {
      errorResponse.error.details = {
        validation: (exceptionResponse as any).message || exceptionResponse,
      };
    }

    // Adicionar stack trace em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      errorResponse.error.stack = exception.stack;
    }

    return errorResponse;
  }

  /**
   * Extrai mensagem de erro da resposta da exceção
   */
  private extractErrorMessage(exceptionResponse: any): string {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (typeof exceptionResponse === 'object') {
      if (exceptionResponse.message) {
        if (Array.isArray(exceptionResponse.message)) {
          return exceptionResponse.message.join(', ');
        }
        return exceptionResponse.message;
      }
      if (exceptionResponse.error) {
        return exceptionResponse.error;
      }
    }

    return 'An error occurred';
  }

  /**
   * Gera código de erro baseado no tipo de exceção
   */
  private generateErrorCode(exception: HttpException, status: number): string {
    // Códigos específicos para exceções customizadas
    if (exception instanceof BaseCustomException) {
      const className = exception.constructor.name;
      return className.replace('Exception', '').toUpperCase();
    }

    // Códigos padrão baseados no status HTTP
    const statusCodes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      405: 'METHOD_NOT_ALLOWED',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
      504: 'GATEWAY_TIMEOUT',
    };

    return statusCodes[status] || `HTTP_${status}`;
  }

  /**
   * Extrai detalhes específicos de exceções customizadas
   */
  private extractCustomExceptionDetails(exception: BaseCustomException): any {
    const details: any = {};

    // Campos específicos de cada tipo de exceção
    if ('field' in exception) details.field = (exception as any).field;
    if ('value' in exception) details.value = (exception as any).value;
    if ('retryAfter' in exception) details.retryAfter = (exception as any).retryAfter;
    if ('service' in exception) details.service = (exception as any).service;
    if ('configKey' in exception) details.configKey = (exception as any).configKey;
    if ('estimatedDowntime' in exception) details.estimatedDowntime = (exception as any).estimatedDowntime;
    if ('resource' in exception) details.resource = (exception as any).resource;
    if ('limit' in exception) details.limit = (exception as any).limit;
    if ('current' in exception) details.current = (exception as any).current;
    if ('paymentProvider' in exception) details.paymentProvider = (exception as any).paymentProvider;
    if ('transactionId' in exception) details.transactionId = (exception as any).transactionId;

    return Object.keys(details).length > 0 ? details : undefined;
  }

  /**
   * Faz o log do erro baseado na severidade
   */
  private logError(exception: HttpException, errorResponse: ErrorResponse, requestContext: any) {
    const { statusCode, code, message, requestId } = errorResponse.error;
    const logContext = {
      requestId,
      statusCode,
      code,
      userId: requestContext.userId,
      ip: requestContext.ip,
      userAgent: requestContext.userAgent,
      error: {
        name: exception.name,
        message: exception.message,
        stack: exception.stack,
      },
    };

    // Log baseado na severidade do erro
    if (statusCode >= 500) {
      // Erros do servidor - críticos
      this.logger.error(`Server Error [${code}]: ${message}`, exception.stack, logContext);
    } else if (statusCode >= 400) {
      // Erros do cliente - warnings
      this.logger.warn(`Client Error [${code}]: ${message}`, logContext);
    } else {
      // Outros - info
      this.logger.log(`HTTP Exception [${code}]: ${message}`, logContext);
    }

    // Log especial para erros de segurança
    if (this.isSecurityRelatedError(statusCode)) {
      this.logger.security(`Security-related error: ${message}`, logContext);
    }
  }

  /**
   * Verifica se é um erro relacionado à segurança
   */
  private isSecurityRelatedError(statusCode: number): boolean {
    return [401, 403, 429].includes(statusCode);
  }

  /**
   * Extrai o IP real do cliente
   */
  private getClientIp(request: Request): string {
    return (
      request.ip ||
      request.connection?.remoteAddress ||
      request.headers['x-forwarded-for']?.toString().split(',')[0] ||
      'unknown'
    );
  }

  /**
   * Gera um ID único para a requisição
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
