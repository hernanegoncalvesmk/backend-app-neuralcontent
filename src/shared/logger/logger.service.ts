import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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
}

/**
 * Enum para níveis de log
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  VERBOSE = 'verbose',
}

/**
 * Serviço de logging estruturado para NeuralContent
 * Implementa logging profissional com contexto, formatação e múltiplos níveis
 */
@Injectable()
export class LoggerService implements NestLoggerService {
  private context?: string;
  private nodeEnv: string;

  constructor(private readonly configService: ConfigService) {
    this.nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
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
    this.printMessage(LogLevel.ERROR, message, { trace, ...context });
  }

  /**
   * Log de warning - alertas importantes
   */
  warn(message: string, context?: LogContext): void {
    this.printMessage(LogLevel.WARN, message, context);
  }

  /**
   * Log de informação - eventos importantes da aplicação
   */
  log(message: string, context?: LogContext): void {
    this.printMessage(LogLevel.INFO, message, context);
  }

  /**
   * Log de debug - informações detalhadas para desenvolvimento
   */
  debug(message: string, context?: LogContext): void {
    if (this.nodeEnv !== 'production') {
      this.printMessage(LogLevel.DEBUG, message, context);
    }
  }

  /**
   * Log verbose - informações muito detalhadas
   */
  verbose(message: string, context?: LogContext): void {
    if (this.nodeEnv === 'development') {
      this.printMessage(LogLevel.VERBOSE, message, context);
    }
  }

  /**
   * Log de evento de segurança
   */
  security(message: string, context?: LogContext): void {
    this.printMessage(LogLevel.WARN, `[SECURITY] ${message}`, {
      ...context,
      security: true,
      metadata: {
        ...context?.metadata,
        alertType: 'security',
      },
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
    this.printMessage(LogLevel.INFO, `[PERFORMANCE] ${message}`, {
      ...context,
      responseTime,
      metadata: {
        ...context?.metadata,
        alertType: 'performance',
      },
    });
  }

  /**
   * Log de auditoria
   */
  audit(action: string, userId: string, context?: LogContext): void {
    this.printMessage(LogLevel.INFO, `[AUDIT] ${action}`, {
      ...context,
      userId,
      metadata: {
        ...context?.metadata,
        alertType: 'audit',
        action,
      },
    });
  }

  /**
   * Log de autenticação
   */
  auth(message: string, context?: LogContext): void {
    this.printMessage(LogLevel.INFO, `[AUTH] ${message}`, {
      ...context,
      metadata: {
        ...context?.metadata,
        alertType: 'authentication',
      },
    });
  }

  /**
   * Log de integração externa
   */
  external(service: string, message: string, context?: LogContext): void {
    this.printMessage(
      LogLevel.INFO,
      `[EXTERNAL:${service.toUpperCase()}] ${message}`,
      {
        ...context,
        metadata: {
          ...context?.metadata,
          alertType: 'external',
          service,
        },
      },
    );
  }

  /**
   * Formata e imprime a mensagem de log
   */
  private printMessage(
    level: LogLevel,
    message: string,
    context?: LogContext,
  ): void {
    const timestamp = new Date().toISOString();
    const pid = process.pid;
    const logContext = this.context || 'Application';

    // Estrutura base do log
    const logEntry = {
      timestamp,
      pid,
      level: level.toUpperCase(),
      context: logContext,
      message,
      ...(context && this.sanitizeContext(context)),
    };

    // Formatação baseada no ambiente
    if (this.nodeEnv === 'production') {
      // Em produção: JSON estruturado para facilitar parsing
      console.log(JSON.stringify(logEntry));
    } else {
      // Em desenvolvimento: formatação mais legível
      this.printColorizedLog(level, logEntry);
    }
  }

  /**
   * Imprime log colorizado para desenvolvimento
   */
  private printColorizedLog(level: LogLevel, logEntry: any): void {
    const colors = {
      [LogLevel.ERROR]: '\x1b[31m', // Vermelho
      [LogLevel.WARN]: '\x1b[33m', // Amarelo
      [LogLevel.INFO]: '\x1b[36m', // Ciano
      [LogLevel.DEBUG]: '\x1b[35m', // Magenta
      [LogLevel.VERBOSE]: '\x1b[37m', // Branco
    };

    const resetColor = '\x1b[0m';
    const color = colors[level] || colors[LogLevel.INFO];

    const {
      timestamp,
      pid,
      level: logLevel,
      context,
      message,
      ...rest
    } = logEntry;

    // Cabeçalho colorizado
    const header = `${color}[${timestamp}]${resetColor} ${color}${logLevel}${resetColor} ${color}[${context}]${resetColor} ${color}${pid}${resetColor}`;

    // Mensagem principal
    console.log(`${header} ${message}`);

    // Contexto adicional (se existir e não for vazio)
    const hasValidContext =
      Object.keys(rest).length > 0 &&
      !(
        Object.keys(rest).length === 1 &&
        typeof rest[Object.keys(rest)[0]] === 'string'
      );

    if (hasValidContext) {
      console.log(
        `${color}Context:${resetColor}`,
        JSON.stringify(rest, null, 2),
      );
    }
  }

  /**
   * Sanitiza o contexto removendo informações sensíveis
   */
  private sanitizeContext(context: LogContext): LogContext {
    const sanitized = { ...context };

    // Remove informações sensíveis
    if (sanitized.error && typeof sanitized.error === 'object') {
      // Mantém apenas stack, message e name do erro
      sanitized.error = {
        message: sanitized.error.message,
        name: sanitized.error.name,
        stack:
          this.nodeEnv !== 'production' ? sanitized.error.stack : undefined,
      };
    }

    // Remove headers sensíveis do userAgent se necessário
    if (sanitized.userAgent && sanitized.userAgent.length > 200) {
      sanitized.userAgent = sanitized.userAgent.substring(0, 200) + '...';
    }

    return sanitized;
  }

  /**
   * Cria um contexto padronizado para requests HTTP
   */
  createRequestContext(req: any, res?: any): LogContext {
    return {
      requestId: req.id || this.generateRequestId(),
      ip: this.getClientIp(req),
      userAgent: req.get('user-agent'),
      method: req.method,
      url: req.originalUrl || req.url,
      userId: req.user?.id,
      statusCode: res?.statusCode,
    };
  }

  /**
   * Gera um ID único para a requisição
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Extrai o IP real do cliente
   */
  private getClientIp(req: any): string {
    return (
      req.ip ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.headers['x-forwarded-for']?.split(',')[0] ||
      'unknown'
    );
  }

  /**
   * Middleware para logging automático de requisições
   */
  logRequest(req: any, res: any, responseTime: number): void {
    const context = this.createRequestContext(req, res);
    context.responseTime = responseTime;

    const message = `${req.method} ${req.originalUrl || req.url} - ${res.statusCode}`;

    if (res.statusCode >= 500) {
      this.error(message, undefined, context);
    } else if (res.statusCode >= 400) {
      this.warn(message, context);
    } else {
      this.log(message, context);
    }
  }

  /**
   * Log de startup da aplicação
   */
  logStartup(port: number, environment: string): void {
    this.log(`🚀 NeuralContent API iniciada`, {
      metadata: {
        port,
        environment,
        nodeVersion: process.version,
        pid: process.pid,
        startupTime: new Date().toISOString(),
      },
    });
  }

  /**
   * Log de shutdown da aplicação
   */
  logShutdown(signal: string): void {
    this.log(`🛑 NeuralContent API encerrando`, {
      metadata: {
        signal,
        uptime: process.uptime(),
        shutdownTime: new Date().toISOString(),
      },
    });
  }
}
