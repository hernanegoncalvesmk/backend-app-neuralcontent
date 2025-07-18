import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import { Request } from 'express';

/**
 * Interface para estrutura padronizada de logs
 */
export interface LogContext {
  userId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  responseTime?: number;
  error?: any;
  trace?: string;
  security?: boolean;
  metadata?: Record<string, any>;
  module?: string;
  action?: string;
  performance?: {
    duration: number;
    memory: number;
    cpu: number;
  };
}

/**
 * Enum para níveis de log
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  DEBUG = 'debug',
  VERBOSE = 'verbose',
}

/**
 * Enum para categorias de log
 */
export enum LogCategory {
  HTTP = 'http',
  AUTH = 'auth',
  DATABASE = 'database',
  CACHE = 'cache',
  PAYMENT = 'payment',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  ERROR = 'error',
  BUSINESS = 'business',
  SYSTEM = 'system',
}

/**
 * Serviço de logging estruturado para NeuralContent
 * Implementa logging profissional com Winston, rotação de arquivos e contexto
 */
@Injectable()
export class WinstonLoggerService implements NestLoggerService {
  private logger: winston.Logger;
  private context?: string;
  private nodeEnv: string;

  constructor(private readonly configService: ConfigService) {
    this.nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    this.createLogger();
  }

  /**
   * Cria e configura a instância do Winston Logger
   */
  private createLogger(): void {
    const logLevel = this.configService.get<string>('LOG_LEVEL', 'info');
    const logDir = this.configService.get<string>('LOG_DIR', 'logs');

    // Formato personalizado para logs estruturados
    const customFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf((info) => {
        const { timestamp, level, message, context, ...meta } = info;
        const logEntry = {
          timestamp,
          level: level.toUpperCase(),
          context: context || this.context || 'Application',
          message,
          ...meta,
        };

        // Em desenvolvimento, usa formato mais legível
        if (this.nodeEnv === 'development') {
          return `[${timestamp}] ${level.toUpperCase().padEnd(7)} [${logEntry.context}] ${message} ${
            Object.keys(meta).length > 0 ? JSON.stringify(meta, null, 2) : ''
          }`;
        }

        return JSON.stringify(logEntry);
      }),
    );

    // Transports para diferentes ambientes
    const transports: winston.transport[] = [];

    // Console transport (sempre ativo)
    transports.push(
      new winston.transports.Console({
        level: logLevel,
        format: winston.format.combine(
          winston.format.colorize(),
          customFormat,
        ),
      }),
    );

    // File transports (apenas em produção ou quando configurado)
    if (this.nodeEnv === 'production' || process.env.ENABLE_FILE_LOGS === 'true') {
      // Log geral com rotação diária
      transports.push(
        new DailyRotateFile({
          dirname: logDir,
          filename: 'application-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          format: customFormat,
          level: logLevel,
        }),
      );

      // Log de erros separado
      transports.push(
        new DailyRotateFile({
          dirname: logDir,
          filename: 'error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
          format: customFormat,
          level: 'error',
        }),
      );

      // Log de HTTP requests separado
      transports.push(
        new DailyRotateFile({
          dirname: logDir,
          filename: 'http-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '7d',
          format: customFormat,
          level: 'http',
        }),
      );

      // Log de segurança separado
      transports.push(
        new DailyRotateFile({
          dirname: logDir,
          filename: 'security-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '90d',
          format: customFormat,
          level: 'warn',
        }),
      );
    }

    this.logger = winston.createLogger({
      level: logLevel,
      format: customFormat,
      transports,
      exitOnError: false,
    });

    // Adiciona handler para uncaught exceptions
    this.logger.exceptions.handle(
      new winston.transports.File({
        filename: `${logDir}/exceptions.log`,
        format: customFormat,
      }),
    );

    // Adiciona handler para unhandled rejections
    this.logger.rejections.handle(
      new winston.transports.File({
        filename: `${logDir}/rejections.log`,
        format: customFormat,
      }),
    );
  }

  /**
   * Define o contexto do logger (classe, módulo, etc.)
   */
  setContext(context: string): void {
    this.context = context;
  }

  /**
   * Log de erro - nível mais alto de prioridade
   */
  error(message: string, trace?: string, context?: LogContext): void {
    this.logger.error(message, {
      context: this.context,
      trace,
      ...context,
    });
  }

  /**
   * Log de warning - alertas importantes
   */
  warn(message: string, context?: LogContext): void {
    this.logger.warn(message, {
      context: this.context,
      ...context,
    });
  }

  /**
   * Log de informação - eventos importantes da aplicação
   */
  log(message: string, context?: LogContext): void {
    this.logger.info(message, {
      context: this.context,
      ...context,
    });
  }

  /**
   * Log de debug - informações detalhadas para desenvolvimento
   */
  debug(message: string, context?: LogContext): void {
    this.logger.debug(message, {
      context: this.context,
      ...context,
    });
  }

  /**
   * Log verbose - informações muito detalhadas
   */
  verbose(message: string, context?: LogContext): void {
    this.logger.verbose(message, {
      context: this.context,
      ...context,
    });
  }

  /**
   * Log de requisições HTTP
   */
  http(message: string, context?: LogContext): void {
    this.logger.log('http', message, {
      context: this.context,
      ...context,
    });
  }

  /**
   * Log de evento de segurança
   */
  security(message: string, context?: LogContext): void {
    this.logger.warn(`[SECURITY] ${message}`, {
      context: this.context,
      ...context,
      security: true,
      category: LogCategory.SECURITY,
    });
  }

  /**
   * Log de performance
   */
  performance(
    message: string,
    responseTime: number,
    context?: LogContext,
  ): void {
    this.logger.info(`[PERFORMANCE] ${message}`, {
      context: this.context,
      ...context,
      responseTime,
      category: LogCategory.PERFORMANCE,
    });
  }

  /**
   * Log de auditoria
   */
  audit(action: string, userId: string, context?: LogContext): void {
    this.logger.info(`[AUDIT] ${action}`, {
      context: this.context,
      ...context,
      userId,
      action,
      category: LogCategory.BUSINESS,
    });
  }

  /**
   * Log de autenticação
   */
  auth(message: string, context?: LogContext): void {
    this.logger.info(`[AUTH] ${message}`, {
      context: this.context,
      ...context,
      category: LogCategory.AUTH,
    });
  }

  /**
   * Log de database operations
   */
  database(message: string, context?: LogContext): void {
    this.logger.info(`[DATABASE] ${message}`, {
      context: this.context,
      ...context,
      category: LogCategory.DATABASE,
    });
  }

  /**
   * Log de cache operations
   */
  cache(message: string, context?: LogContext): void {
    this.logger.debug(`[CACHE] ${message}`, {
      context: this.context,
      ...context,
      category: LogCategory.CACHE,
    });
  }

  /**
   * Log de payment operations
   */
  payment(message: string, context?: LogContext): void {
    this.logger.info(`[PAYMENT] ${message}`, {
      context: this.context,
      ...context,
      category: LogCategory.PAYMENT,
    });
  }

  /**
   * Log de integração externa
   */
  external(service: string, message: string, context?: LogContext): void {
    this.logger.info(`[EXTERNAL:${service.toUpperCase()}] ${message}`, {
      context: this.context,
      ...context,
      service,
      category: LogCategory.SYSTEM,
    });
  }

  /**
   * Cria contexto de request para logging
   */
  createRequestContext(request: Request): LogContext {
    const requestId = request.headers['x-request-id'] as string || this.generateRequestId();
    const userAgent = request.headers['user-agent'] || 'Unknown';
    const ip = request.ip || request.connection.remoteAddress || 'Unknown';

    return {
      requestId,
      method: request.method,
      url: request.originalUrl || request.url,
      ip,
      userAgent,
      userId: (request as any).user?.sub?.toString(),
    };
  }

  /**
   * Gera um ID único para a requisição
   */
  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sanitiza dados sensíveis do contexto
   */
  private sanitizeContext(context: LogContext): LogContext {
    const sanitized = { ...context };

    // Remove dados sensíveis
    if (sanitized.metadata) {
      const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
      sensitiveFields.forEach(field => {
        if (sanitized.metadata && sanitized.metadata[field]) {
          sanitized.metadata[field] = '[REDACTED]';
        }
      });
    }

    return sanitized;
  }

  /**
   * Métricas de performance da aplicação
   */
  getPerformanceMetrics(): {
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
    pid: number;
  } {
    return {
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      pid: process.pid,
    };
  }

  /**
   * Log estruturado de erro com stack trace
   */
  logError(error: Error, context?: LogContext): void {
    this.logger.error(error.message, {
      context: this.context,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      ...context,
    });
  }

  /**
   * Log de transação de negócio
   */
  transaction(
    action: string,
    userId: string,
    details: Record<string, any>,
    context?: LogContext,
  ): void {
    this.logger.info(`[TRANSACTION] ${action}`, {
      context: this.context,
      userId,
      action,
      transaction: details,
      category: LogCategory.BUSINESS,
      ...context,
    });
  }

  /**
   * Log de métricas de performance específicas
   */
  metric(name: string, value: number, unit: string, context?: LogContext): void {
    this.logger.info(`[METRIC] ${name}: ${value}${unit}`, {
      context: this.context,
      metric: {
        name,
        value,
        unit,
        timestamp: new Date().toISOString(),
      },
      category: LogCategory.PERFORMANCE,
      ...context,
    });
  }
}
