import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Filtro específico para erros de validação
 * Fornece respostas mais detalhadas para erros de validação de entrada
 */
@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ValidationExceptionFilter.name);

  catch(exception: BadRequestException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as any;

    // Estruturar erros de validação de forma mais amigável
    let validationErrors = null;
    if (exceptionResponse.message && Array.isArray(exceptionResponse.message)) {
      validationErrors = this.formatValidationErrors(exceptionResponse.message);
    }

    const errorResponse = {
      success: false,
      error: {
        statusCode: status,
        message: 'Dados de entrada inválidos',
        validationErrors,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
      },
    };

    this.logger.warn(
      `Erro de validação: ${request.method} ${request.url}`,
      {
        validationErrors,
        requestBody: request.body,
      },
    );

    response.status(status).json(errorResponse);
  }

  private formatValidationErrors(messages: string[]): Record<string, string[]> {
    const errors: Record<string, string[]> = {};

    messages.forEach((message) => {
      // Extrair campo e erro da mensagem (formato: "campo must be...")
      const match = message.match(/^(\w+)\s+(.+)$/);
      if (match) {
        const [, field, errorMessage] = match;
        if (!errors[field]) {
          errors[field] = [];
        }
        errors[field].push(errorMessage);
      } else {
        // Fallback para mensagens que não seguem o padrão
        if (!errors['general']) {
          errors['general'] = [];
        }
        errors['general'].push(message);
      }
    });

    return errors;
  }
}
