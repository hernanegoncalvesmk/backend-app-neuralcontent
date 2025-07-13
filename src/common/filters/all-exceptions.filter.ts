import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erro interno do servidor';
    let details: any = null;

    // Tratamento para HttpException (erros do NestJS)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || responseObj.error || message;
        details = responseObj.details || null;
      }
    } 
    // Tratamento para erros de validação
    else if (exception instanceof Error) {
      message = exception.message;
      
      // Log da stack trace para debugging
      this.logger.error(exception.stack);
    }

    // Estrutura de resposta de erro padronizada
    const errorResponse = {
      success: false,
      error: {
        statusCode: status,
        message,
        details,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
      },
    };

    // Log do erro
    this.logger.error(
      `${request.method} ${request.url} - Status: ${status} - Error: ${message}`,
      {
        error: exception,
        request: {
          method: request.method,
          url: request.url,
          headers: request.headers,
          body: request.body,
          query: request.query,
          params: request.params,
          user: request['user'],
        },
      },
    );

    response.status(status).json(errorResponse);
  }
}
