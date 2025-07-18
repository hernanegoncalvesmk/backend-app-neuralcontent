import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { WinstonLoggerService } from '../logger/winston-logger.service';
import { Request } from 'express';

/**
 * Interceptor para coleta e logging de métricas de performance
 */
@Injectable()
export class PerformanceMetricsInterceptor implements NestInterceptor {
  private readonly performanceThresholds = {
    fast: 100,      // < 100ms
    normal: 500,    // 100-500ms
    slow: 1000,     // 500ms-1s
    critical: 5000, // > 5s
  };

  constructor(
    @Inject('WINSTON_LOGGER')
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext('Performance');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const startTime = process.hrtime.bigint();
    const startMemory = process.memoryUsage();
    const startCpu = process.cpuUsage();

    return next.handle().pipe(
      tap(() => {
        const endTime = process.hrtime.bigint();
        const endMemory = process.memoryUsage();
        const endCpu = process.cpuUsage(startCpu);

        const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
        const memoryDelta = {
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          heapTotal: endMemory.heapTotal - startMemory.heapTotal,
          external: endMemory.external - startMemory.external,
          rss: endMemory.rss - startMemory.rss,
        };

        const cpuUsage = {
          user: endCpu.user / 1000, // Convert to milliseconds
          system: endCpu.system / 1000,
        };

        // Determina categoria de performance
        const performanceCategory = this.getPerformanceCategory(duration);

        // Log métricas básicas
        this.logger.metric('request_duration', duration, 'ms', {
          method: request.method,
          url: request.originalUrl,
          metadata: {
            category: performanceCategory,
          },
        });

        this.logger.metric('memory_heap_delta', memoryDelta.heapUsed, 'bytes', {
          method: request.method,
          url: request.originalUrl,
        });

        this.logger.metric('cpu_user_time', cpuUsage.user, 'ms', {
          method: request.method,
          url: request.originalUrl,
        });

        // Log detalhado para requisições lentas
        if (duration > this.performanceThresholds.slow) {
          this.logger.performance(
            `Slow request detected: ${request.method} ${request.originalUrl}`,
            duration,
            {
              method: request.method,
              url: request.originalUrl,
              performance: {
                duration,
                memory: memoryDelta.heapUsed,
                cpu: cpuUsage.user + cpuUsage.system,
              },
              metadata: {
                category: performanceCategory,
                thresholds: this.performanceThresholds,
                memoryUsage: {
                  heapUsed: this.formatBytes(memoryDelta.heapUsed),
                  heapTotal: this.formatBytes(memoryDelta.heapTotal),
                  external: this.formatBytes(memoryDelta.external),
                  rss: this.formatBytes(memoryDelta.rss),
                },
                cpuUsage: {
                  user: `${cpuUsage.user.toFixed(2)}ms`,
                  system: `${cpuUsage.system.toFixed(2)}ms`,
                  total: `${(cpuUsage.user + cpuUsage.system).toFixed(2)}ms`,
                },
              },
            },
          );
        }

        // Log crítico para requisições muito lentas
        if (duration > this.performanceThresholds.critical) {
          this.logger.warn(
            `Critical performance issue: ${request.method} ${request.originalUrl} took ${duration.toFixed(2)}ms`,
            {
              method: request.method,
              url: request.originalUrl,
              responseTime: duration,
              metadata: {
                severity: 'critical',
                action: 'immediate_investigation_required',
                performanceCategory,
              },
            },
          );
        }
      }),
    );
  }

  /**
   * Determina a categoria de performance baseada na duração
   */
  private getPerformanceCategory(duration: number): string {
    if (duration < this.performanceThresholds.fast) return 'fast';
    if (duration < this.performanceThresholds.normal) return 'normal';
    if (duration < this.performanceThresholds.slow) return 'slow';
    if (duration < this.performanceThresholds.critical) return 'very_slow';
    return 'critical';
  }

  /**
   * Formata bytes para formato legível
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
}
