import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../logger/logger.service';
import { ErrorResponse } from './http-exception.filter';

/**
 * Filtro global para capturar todas as exceções não tratadas
 * Incluindo erros de sistema, de banco de dados, etc.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly fallbackLogger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly logger: LoggerService) {
    this.logger.setContext('AllExceptionsFilter');
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Gerar ID único para a requisição
    const requestId = (request as any).id || this.generateRequestId();

    // Extrair contexto da requisição
    const requestContext = this.extractRequestContext(request);

    // Determinar o status e mensagem baseado no tipo de erro
    const { status, message, code } = this.analyzeException(exception);

    // Construir resposta de erro
    const errorResponse = this.buildErrorResponse(
      exception,
      status,
      message,
      code,
      requestContext,
      requestId
    );

    // Log crítico do erro
    this.logCriticalError(exception, errorResponse, requestContext);

    // Enviar resposta
    response.status(status).json(errorResponse);
  }

  /**
   * Analisa a exceção para determinar status, mensagem e código
   */
  private analyzeException(exception: unknown): { status: number; message: string; code: string } {
    // Erro de validação do class-validator
    if (this.isValidationError(exception)) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
      };
    }

    // Erro de banco de dados (TypeORM)
    if (this.isDatabaseError(exception)) {
      const dbError = this.analyzeDatabaseError(exception as any);
      return {
        status: dbError.status,
        message: dbError.message,
        code: dbError.code,
      };
    }

    // Erro de sintaxe JSON
    if (this.isJSONSyntaxError(exception)) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Invalid JSON syntax',
        code: 'JSON_SYNTAX_ERROR',
      };
    }

    // Erro de timeout
    if (this.isTimeoutError(exception)) {
      return {
        status: HttpStatus.REQUEST_TIMEOUT,
        message: 'Request timeout',
        code: 'TIMEOUT_ERROR',
      };
    }

    // Erro de memória
    if (this.isOutOfMemoryError(exception)) {
      return {
        status: HttpStatus.INSUFFICIENT_STORAGE,
        message: 'Insufficient server resources',
        code: 'OUT_OF_MEMORY',
      };
    }

    // Erro de referência (código)
    if (this.isReferenceError(exception)) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal reference error',
        code: 'REFERENCE_ERROR',
      };
    }

    // Erro de tipo (código)
    if (this.isTypeError(exception)) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal type error',
        code: 'TYPE_ERROR',
      };
    }

    // Erro genérico
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    };
  }

  /**
   * Analisa erros específicos de banco de dados
   */
  private analyzeDatabaseError(error: any): { status: number; message: string; code: string } {
    const errorCode = error.code || error.errno;
    const sqlState = error.sqlState;

    // Duplicate entry (MySQL: 1062, PostgreSQL: 23505)
    if (errorCode === 1062 || errorCode === '23505' || sqlState === '23000') {
      return {
        status: HttpStatus.CONFLICT,
        message: 'Duplicate entry - resource already exists',
        code: 'DUPLICATE_ENTRY',
      };
    }

    // Foreign key constraint (MySQL: 1452, PostgreSQL: 23503)
    if (errorCode === 1452 || errorCode === '23503') {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Foreign key constraint violation',
        code: 'FOREIGN_KEY_VIOLATION',
      };
    }

    // Connection refused
    if (errorCode === 'ECONNREFUSED' || errorCode === 'ENOTFOUND') {
      return {
        status: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Database connection failed',
        code: 'DATABASE_CONNECTION_ERROR',
      };
    }

    // Timeout
    if (errorCode === 'ETIMEDOUT' || error.message?.includes('timeout')) {
      return {
        status: HttpStatus.REQUEST_TIMEOUT,
        message: 'Database operation timeout',
        code: 'DATABASE_TIMEOUT',
      };
    }

    // Syntax error (MySQL: 1064)
    if (errorCode === 1064) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Database query syntax error',
        code: 'SQL_SYNTAX_ERROR',
      };
    }

    // Access denied (MySQL: 1045)
    if (errorCode === 1045) {
      return {
        status: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Database access denied',
        code: 'DATABASE_ACCESS_DENIED',
      };
    }

    // Generic database error
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Database operation failed',
      code: 'DATABASE_ERROR',
    };
  }

  /**
   * Constrói resposta de erro estruturada
   */
  private buildErrorResponse(
    exception: unknown,
    status: number,
    message: string,
    code: string,
    requestContext: any,
    requestId: string
  ): ErrorResponse {
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

    // Adicionar stack trace em desenvolvimento
    if (process.env.NODE_ENV === 'development' && exception instanceof Error) {
      errorResponse.error.stack = exception.stack;
    }

    // Adicionar detalhes específicos baseado no tipo de erro
    if (this.isDatabaseError(exception)) {
      errorResponse.error.details = {
        type: 'database_error',
        code: (exception as any).code,
        sqlState: (exception as any).sqlState,
      };
    }

    return errorResponse;
  }

  /**
   * Faz log crítico do erro
   */
  private logCriticalError(exception: unknown, errorResponse: ErrorResponse, requestContext: any) {
    const { statusCode, code, message, requestId } = errorResponse.error;

    const logContext = {
      requestId,
      statusCode,
      code,
      userId: requestContext.userId,
      ip: requestContext.ip,
      userAgent: requestContext.userAgent,
      error: {
        name: exception instanceof Error ? exception.name : 'UnknownError',
        message: exception instanceof Error ? exception.message : String(exception),
        stack: exception instanceof Error ? exception.stack : undefined,
      },
    };

    try {
      // Usar nosso logger customizado
      this.logger.error(`Critical Error [${code}]: ${message}`, 
        exception instanceof Error ? exception.stack : undefined, 
        logContext
      );
    } catch (loggerError) {
      // Fallback para o logger padrão do NestJS se nosso logger falhar
      this.fallbackLogger.error(`Critical Error [${code}]: ${message}`, exception);
      this.fallbackLogger.error('Logger service failed:', loggerError);
    }

    // Log especial para erros de sistema críticos
    if (statusCode >= 500) {
      try {
        this.logger.security(`System critical error: ${message}`, logContext);
      } catch {
        this.fallbackLogger.error(`System critical error: ${message}`);
      }
    }
  }

  /**
   * Extrai contexto da requisição
   */
  private extractRequestContext(request: Request) {
    return {
      path: request.url,
      method: request.method,
      userAgent: request.get('user-agent'),
      ip: this.getClientIp(request),
      userId: (request as any).user?.id,
      sessionId: (request as any).sessionId,
    };
  }

  /**
   * Verifica se é erro de validação
   */
  private isValidationError(exception: unknown): boolean {
    return exception instanceof Error && 
           (exception.name === 'ValidationError' || 
            exception.message.includes('validation'));
  }

  /**
   * Verifica se é erro de banco de dados
   */
  private isDatabaseError(exception: unknown): boolean {
    if (!(exception instanceof Error)) return false;
    
    const dbErrorIndicators = [
      'QueryFailedError',
      'ConnectionNotFoundError',
      'CannotCreateEntityIdMapError',
      'EntityNotFoundError',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ER_',
      'errno',
      'sqlState'
    ];

    return dbErrorIndicators.some(indicator => 
      exception.name.includes(indicator) || 
      exception.message.includes(indicator) ||
      (exception as any).code?.toString().includes(indicator)
    );
  }

  /**
   * Verifica se é erro de sintaxe JSON
   */
  private isJSONSyntaxError(exception: unknown): boolean {
    return exception instanceof SyntaxError && 
           exception.message.includes('JSON');
  }

  /**
   * Verifica se é erro de timeout
   */
  private isTimeoutError(exception: unknown): boolean {
    return exception instanceof Error && 
           (exception.message.includes('timeout') || 
            exception.message.includes('ETIMEDOUT'));
  }

  /**
   * Verifica se é erro de memória
   */
  private isOutOfMemoryError(exception: unknown): boolean {
    return exception instanceof Error && 
           (exception.message.includes('out of memory') || 
            exception.message.includes('ENOMEM'));
  }

  /**
   * Verifica se é erro de referência
   */
  private isReferenceError(exception: unknown): boolean {
    return exception instanceof ReferenceError;
  }

  /**
   * Verifica se é erro de tipo
   */
  private isTypeError(exception: unknown): boolean {
    return exception instanceof TypeError;
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
