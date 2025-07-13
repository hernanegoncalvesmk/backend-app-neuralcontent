import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Exceção base personalizada para NeuralContent
 */
export class BaseCustomException extends HttpException {
  public readonly timestamp: string;
  public readonly path?: string;
  public readonly method?: string;
  public readonly userAgent?: string;
  public readonly ip?: string;

  constructor(
    message: string,
    status: HttpStatus,
    context?: {
      path?: string;
      method?: string;
      userAgent?: string;
      ip?: string;
    }
  ) {
    super(message, status);
    this.timestamp = new Date().toISOString();
    this.path = context?.path;
    this.method = context?.method;
    this.userAgent = context?.userAgent;
    this.ip = context?.ip;
  }
}

/**
 * Exceção para erros de validação de negócio
 */
export class BusinessValidationException extends BaseCustomException {
  constructor(message: string, context?: any) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY, context);
  }
}

/**
 * Exceção para recursos não encontrados
 */
export class ResourceNotFoundException extends BaseCustomException {
  constructor(resource: string, identifier?: string | number, context?: any) {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, HttpStatus.NOT_FOUND, context);
  }
}

/**
 * Exceção para conflitos de recursos (ex: email já existe)
 */
export class ResourceConflictException extends BaseCustomException {
  constructor(message: string, context?: any) {
    super(message, HttpStatus.CONFLICT, context);
  }
}

/**
 * Exceção para operações não autorizadas
 */
export class UnauthorizedOperationException extends BaseCustomException {
  constructor(operation: string, context?: any) {
    super(`Unauthorized to perform operation: ${operation}`, HttpStatus.FORBIDDEN, context);
  }
}

/**
 * Exceção para dados inválidos
 */
export class InvalidDataException extends BaseCustomException {
  public readonly field?: string;
  public readonly value?: any;

  constructor(message: string, field?: string, value?: any, context?: any) {
    super(message, HttpStatus.BAD_REQUEST, context);
    this.field = field;
    this.value = value;
  }
}

/**
 * Exceção para limite de taxa excedido
 */
export class RateLimitExceededException extends BaseCustomException {
  public readonly retryAfter?: number;

  constructor(retryAfter?: number, context?: any) {
    super('Rate limit exceeded. Please try again later.', HttpStatus.TOO_MANY_REQUESTS, context);
    this.retryAfter = retryAfter;
  }
}

/**
 * Exceção para erros de autenticação
 */
export class AuthenticationException extends BaseCustomException {
  constructor(message: string = 'Authentication failed', context?: any) {
    super(message, HttpStatus.UNAUTHORIZED, context);
  }
}

/**
 * Exceção para erros de autorização
 */
export class AuthorizationException extends BaseCustomException {
  constructor(message: string = 'Access denied', context?: any) {
    super(message, HttpStatus.FORBIDDEN, context);
  }
}

/**
 * Exceção para erros de integração externa
 */
export class ExternalServiceException extends BaseCustomException {
  public readonly service: string;
  public readonly originalError?: any;

  constructor(service: string, message: string, originalError?: any, context?: any) {
    super(`External service error (${service}): ${message}`, HttpStatus.BAD_GATEWAY, context);
    this.service = service;
    this.originalError = originalError;
  }
}

/**
 * Exceção para erros de configuração
 */
export class ConfigurationException extends BaseCustomException {
  public readonly configKey?: string;

  constructor(message: string, configKey?: string, context?: any) {
    super(`Configuration error: ${message}`, HttpStatus.INTERNAL_SERVER_ERROR, context);
    this.configKey = configKey;
  }
}

/**
 * Exceção para manutenção/indisponibilidade do serviço
 */
export class ServiceUnavailableException extends BaseCustomException {
  public readonly estimatedDowntime?: string;

  constructor(message: string = 'Service temporarily unavailable', estimatedDowntime?: string, context?: any) {
    super(message, HttpStatus.SERVICE_UNAVAILABLE, context);
    this.estimatedDowntime = estimatedDowntime;
  }
}

/**
 * Exceção para limite de recursos excedido (ex: storage, créditos)
 */
export class ResourceLimitException extends BaseCustomException {
  public readonly resource: string;
  public readonly limit: number;
  public readonly current: number;

  constructor(resource: string, limit: number, current: number, context?: any) {
    super(
      `Resource limit exceeded for ${resource}. Current: ${current}, Limit: ${limit}`,
      HttpStatus.FORBIDDEN,
      context
    );
    this.resource = resource;
    this.limit = limit;
    this.current = current;
  }
}

/**
 * Exceção para operações de pagamento
 */
export class PaymentException extends BaseCustomException {
  public readonly paymentProvider?: string;
  public readonly transactionId?: string;

  constructor(message: string, paymentProvider?: string, transactionId?: string, context?: any) {
    super(`Payment error: ${message}`, HttpStatus.PAYMENT_REQUIRED, context);
    this.paymentProvider = paymentProvider;
    this.transactionId = transactionId;
  }
}

/**
 * Utilitário para criar exceções com contexto de requisição
 */
export class ExceptionFactory {
  static createWithRequestContext(
    ExceptionClass: new (...args: any[]) => BaseCustomException,
    request: any,
    ...args: any[]
  ): BaseCustomException {
    const context = {
      path: request.url,
      method: request.method,
      userAgent: request.get('user-agent'),
      ip: request.ip || request.connection?.remoteAddress || 'unknown'
    };

    return new ExceptionClass(...args, context);
  }
}
