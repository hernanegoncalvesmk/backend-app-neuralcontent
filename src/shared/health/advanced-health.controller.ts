import { Controller, Get, HttpStatus, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DatabaseHealthService } from '../../database/database-health.service';
import { CacheService } from '../cache/cache.service';
import { WinstonLoggerService } from '../logger/winston-logger.service';
import * as os from 'os';
import { promises as fs } from 'fs';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  instance: {
    id: string;
    hostname: string;
    platform: string;
    arch: string;
    nodeVersion: string;
  };
  services: {
    database: ServiceHealth;
    cache: ServiceHealth;
    memory: ServiceHealth;
    disk: ServiceHealth;
    external: ServiceHealth;
  };
  metrics: {
    response_time: number;
    requests_total: number;
    errors_total: number;
    memory_usage: MemoryUsage;
    system_load: SystemLoad;
    performance: PerformanceMetrics;
  };
  alerts?: Alert[];
}

interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  response_time?: number;
  details?: any;
  last_check: string;
  error?: string;
}

interface MemoryUsage {
  used_mb: number;
  total_mb: number;
  usage_percentage: number;
  heap_used_mb: number;
  heap_total_mb: number;
  heap_limit_mb: number;
  external_mb: number;
  gc_stats?: {
    collections: number;
    pause_time_ms: number;
  };
}

interface SystemLoad {
  cpu_count: number;
  load_average: number[];
  uptime_seconds: number;
  cpu_usage_percentage: number;
  free_memory_mb: number;
  total_memory_mb: number;
}

interface PerformanceMetrics {
  avg_response_time: number;
  p95_response_time: number;
  p99_response_time: number;
  requests_per_second: number;
  error_rate: number;
  active_connections: number;
}

interface Alert {
  level: 'warning' | 'critical';
  message: string;
  service: string;
  timestamp: string;
  details?: any;
}

@ApiTags('🏥 Monitoramento')
@Controller('health')
export class AdvancedHealthController {
  private startTime = Date.now();
  private requestCount = 0;
  private errorCount = 0;
  private responseTimes: number[] = [];
  private lastHealthCheck = Date.now();

  constructor(
    private readonly databaseHealthService: DatabaseHealthService,
    private readonly cacheService: CacheService,
    @Inject('WINSTON_LOGGER')
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext('HealthController');
    
    // Inicia coleta de métricas de sistema
    this.startSystemMetricsCollection();
  }

  @Get()
  @ApiOperation({
    summary: 'Health Check Completo do Sistema',
    description:
      'Retorna o status detalhado da aplicação incluindo todos os serviços, métricas de performance e alertas',
  })
  @ApiResponse({
    status: 200,
    description: 'Status da aplicação',
    schema: {
      example: {
        status: 'healthy',
        timestamp: '2025-07-17T12:00:00.000Z',
        uptime: 3661.25,
        version: '1.0.0',
        environment: 'development',
        instance: {
          id: 'neural-api-001',
          hostname: 'localhost',
          platform: 'win32',
          arch: 'x64',
          nodeVersion: 'v18.17.0',
        },
        services: {
          database: {
            status: 'healthy',
            response_time: 12,
            last_check: '2025-07-17T12:00:00.000Z',
            details: { connections: 5, queries_per_sec: 150 },
          },
          cache: {
            status: 'healthy',
            response_time: 3,
            last_check: '2025-07-17T12:00:00.000Z',
            details: { hit_ratio: 0.95, memory_usage: '256MB' },
          },
          memory: {
            status: 'healthy',
            last_check: '2025-07-17T12:00:00.000Z',
            details: { usage_percentage: 65 },
          },
          disk: {
            status: 'healthy',
            last_check: '2025-07-17T12:00:00.000Z',
            details: { free_space: '15GB', usage_percentage: 45 },
          },
        },
        metrics: {
          response_time: 125,
          requests_total: 1500,
          errors_total: 3,
          memory_usage: {
            used_mb: 256,
            total_mb: 1024,
            usage_percentage: 25,
            heap_used_mb: 180,
            heap_total_mb: 220,
          },
          system_load: {
            cpu_count: 8,
            load_average: [1.2, 1.5, 1.8],
            uptime_seconds: 86400,
            cpu_usage_percentage: 15,
          },
          performance: {
            avg_response_time: 125,
            p95_response_time: 300,
            p99_response_time: 500,
            requests_per_second: 25,
            error_rate: 0.002,
          },
        },
      },
    },
  })
  async getHealth(): Promise<HealthStatus> {
    const startTime = Date.now();
    this.requestCount++;

    try {
      // Coleta status de todos os serviços
      const [databaseHealth, cacheHealth, memoryHealth, diskHealth, externalHealth] =
        await Promise.allSettled([
          this.checkDatabaseHealth(),
          this.checkCacheHealth(),
          this.checkMemoryHealth(),
          this.checkDiskHealth(),
          this.checkExternalServicesHealth(),
        ]);

      const responseTime = Date.now() - startTime;
      this.responseTimes.push(responseTime);

      // Mantém apenas os últimos 1000 tempos de resposta
      if (this.responseTimes.length > 1000) {
        this.responseTimes = this.responseTimes.slice(-1000);
      }

      const healthStatus: HealthStatus = {
        status: this.calculateOverallStatus([
          this.getResultValue(databaseHealth),
          this.getResultValue(cacheHealth),
          this.getResultValue(memoryHealth),
          this.getResultValue(diskHealth),
          this.getResultValue(externalHealth),
        ]),
        timestamp: new Date().toISOString(),
        uptime: (Date.now() - this.startTime) / 1000,
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        instance: {
          id: process.env.INSTANCE_ID || `neural-api-${Math.random().toString(36).substr(2, 6)}`,
          hostname: os.hostname(),
          platform: os.platform(),
          arch: os.arch(),
          nodeVersion: process.version,
        },
        services: {
          database: this.getResultValue(databaseHealth),
          cache: this.getResultValue(cacheHealth),
          memory: this.getResultValue(memoryHealth),
          disk: this.getResultValue(diskHealth),
          external: this.getResultValue(externalHealth),
        },
        metrics: {
          response_time: responseTime,
          requests_total: this.requestCount,
          errors_total: this.errorCount,
          memory_usage: this.getMemoryMetrics(),
          system_load: this.getSystemLoadMetrics(),
          performance: this.getPerformanceMetrics(),
        },
        alerts: this.generateAlerts(),
      };

      // Log do health check
      this.logger.log('Health check completed', {
        responseTime,
        metadata: {
          status: healthStatus.status,
          services: Object.keys(healthStatus.services).reduce((acc, key) => {
            acc[key] = (healthStatus.services as any)[key].status;
            return acc;
          }, {} as Record<string, string>),
        },
      });

      this.lastHealthCheck = Date.now();
      return healthStatus;

    } catch (error) {
      this.errorCount++;
      this.logger.error('Health check failed', error.stack, {
        error: error.message,
        responseTime: Date.now() - startTime,
      });

      throw error;
    }
  }

  @Get('live')
  @ApiOperation({
    summary: 'Liveness Probe',
    description: 'Endpoint simples para verificar se a aplicação está viva (para Kubernetes)',
  })
  @ApiResponse({ status: 200, description: 'Aplicação está viva' })
  async getLiveness(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @ApiOperation({
    summary: 'Readiness Probe',
    description: 'Verifica se a aplicação está pronta para receber tráfego',
  })
  @ApiResponse({ status: 200, description: 'Aplicação está pronta' })
  async getReadiness(): Promise<{ status: string; services: Record<string, string> }> {
    const [database, cache] = await Promise.allSettled([
      this.checkDatabaseHealth(),
      this.checkCacheHealth(),
    ]);

    const services = {
      database: this.getResultValue(database).status,
      cache: this.getResultValue(cache).status,
    };

    const allHealthy = Object.values(services).every(status => status === 'healthy');

    return {
      status: allHealthy ? 'ready' : 'not_ready',
      services,
    };
  }

  @Get('metrics')
  @ApiOperation({
    summary: 'Métricas Detalhadas',
    description: 'Retorna métricas detalhadas de performance e sistema',
  })
  async getMetrics(): Promise<any> {
    return {
      timestamp: new Date().toISOString(),
      application: {
        uptime_seconds: (Date.now() - this.startTime) / 1000,
        requests_total: this.requestCount,
        errors_total: this.errorCount,
        error_rate: this.requestCount > 0 ? this.errorCount / this.requestCount : 0,
      },
      performance: this.getPerformanceMetrics(),
      memory: this.getMemoryMetrics(),
      system: this.getSystemLoadMetrics(),
      gc: this.getGCStats(),
    };
  }

  /**
   * Verifica saúde do banco de dados
   */
  private async checkDatabaseHealth(): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      // Verifica conectividade e obtém informações
      const [isConnected, dbInfo] = await Promise.all([
        this.databaseHealthService.isConnected(),
        this.databaseHealthService.getDatabaseInfo(),
      ]);
      
      const responseTime = Date.now() - startTime;

      return {
        status: isConnected ? 'healthy' : 'unhealthy',
        response_time: responseTime,
        details: dbInfo,
        last_check: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        response_time: Date.now() - startTime,
        error: error.message,
        last_check: new Date().toISOString(),
      };
    }
  }

  /**
   * Verifica saúde do cache
   */
  private async checkCacheHealth(): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      await this.cacheService.get('health_check');
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        response_time: responseTime,
        last_check: new Date().toISOString(),
        details: {
          type: 'redis',
          connected: true,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        response_time: Date.now() - startTime,
        error: error.message,
        last_check: new Date().toISOString(),
      };
    }
  }

  /**
   * Verifica saúde da memória
   */
  private async checkMemoryHealth(): Promise<ServiceHealth> {
    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usagePercentage = ((totalMemory - freeMemory) / totalMemory) * 100;

    const status = usagePercentage > 90 ? 'unhealthy' : 
                   usagePercentage > 75 ? 'degraded' : 'healthy';

    return {
      status,
      last_check: new Date().toISOString(),
      details: {
        heap_used_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heap_total_mb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external_mb: Math.round(memoryUsage.external / 1024 / 1024),
        usage_percentage: Math.round(usagePercentage),
        free_memory_mb: Math.round(freeMemory / 1024 / 1024),
      },
    };
  }

  /**
   * Verifica saúde do disco
   */
  private async checkDiskHealth(): Promise<ServiceHealth> {
    try {
      const stats = await fs.stat(process.cwd());
      // Esta é uma verificação básica - em produção, você usaria bibliotecas específicas
      
      return {
        status: 'healthy',
        last_check: new Date().toISOString(),
        details: {
          writable: true,
          path: process.cwd(),
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        last_check: new Date().toISOString(),
      };
    }
  }

  /**
   * Verifica saúde de serviços externos
   */
  private async checkExternalServicesHealth(): Promise<ServiceHealth> {
    // Placeholder para verificação de serviços externos (Stripe, PayPal, etc.)
    return {
      status: 'healthy',
      last_check: new Date().toISOString(),
      details: {
        external_apis: 'not_implemented',
      },
    };
  }

  /**
   * Obtém métricas de memória
   */
  private getMemoryMetrics(): MemoryUsage {
    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    return {
      used_mb: Math.round(usedMemory / 1024 / 1024),
      total_mb: Math.round(totalMemory / 1024 / 1024),
      usage_percentage: Math.round((usedMemory / totalMemory) * 100),
      heap_used_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heap_total_mb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heap_limit_mb: Math.round((memoryUsage as any).heapLimit / 1024 / 1024) || 0,
      external_mb: Math.round(memoryUsage.external / 1024 / 1024),
    };
  }

  /**
   * Obtém métricas de carga do sistema
   */
  private getSystemLoadMetrics(): SystemLoad {
    const loadAvg = os.loadavg();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();

    return {
      cpu_count: os.cpus().length,
      load_average: loadAvg,
      uptime_seconds: os.uptime(),
      cpu_usage_percentage: this.getCPUUsagePercentage(),
      free_memory_mb: Math.round(freeMemory / 1024 / 1024),
      total_memory_mb: Math.round(totalMemory / 1024 / 1024),
    };
  }

  /**
   * Obtém métricas de performance
   */
  private getPerformanceMetrics(): PerformanceMetrics {
    if (this.responseTimes.length === 0) {
      return {
        avg_response_time: 0,
        p95_response_time: 0,
        p99_response_time: 0,
        requests_per_second: 0,
        error_rate: 0,
        active_connections: 0,
      };
    }

    const sorted = [...this.responseTimes].sort((a, b) => a - b);
    const avg = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
    const p95Index = Math.floor(sorted.length * 0.95);
    const p99Index = Math.floor(sorted.length * 0.99);

    const uptime = (Date.now() - this.startTime) / 1000;
    const requestsPerSecond = uptime > 0 ? this.requestCount / uptime : 0;
    const errorRate = this.requestCount > 0 ? this.errorCount / this.requestCount : 0;

    return {
      avg_response_time: Math.round(avg),
      p95_response_time: sorted[p95Index] || 0,
      p99_response_time: sorted[p99Index] || 0,
      requests_per_second: Math.round(requestsPerSecond * 100) / 100,
      error_rate: Math.round(errorRate * 10000) / 10000,
      active_connections: 0, // Seria necessário rastrear conexões ativas
    };
  }

  /**
   * Obtém estatísticas de Garbage Collection
   */
  private getGCStats(): any {
    // Seria necessário implementar com v8 ou biblioteca específica
    return {
      collections: 0,
      pause_time_ms: 0,
      memory_freed_mb: 0,
    };
  }

  /**
   * Calcula porcentagem de uso de CPU
   */
  private getCPUUsagePercentage(): number {
    // Implementação simplificada - em produção usaria bibliotecas específicas
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      const times = cpu.times as any;
      for (const type in times) {
        totalTick += times[type];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~(100 * idle / total);

    return usage;
  }

  /**
   * Gera alertas baseados no status dos serviços
   */
  private generateAlerts(): Alert[] {
    const alerts: Alert[] = [];
    const memoryMetrics = this.getMemoryMetrics();

    if (memoryMetrics.usage_percentage > 90) {
      alerts.push({
        level: 'critical',
        message: `High memory usage: ${memoryMetrics.usage_percentage}%`,
        service: 'memory',
        timestamp: new Date().toISOString(),
        details: { usage_percentage: memoryMetrics.usage_percentage },
      });
    } else if (memoryMetrics.usage_percentage > 75) {
      alerts.push({
        level: 'warning',
        message: `Elevated memory usage: ${memoryMetrics.usage_percentage}%`,
        service: 'memory',
        timestamp: new Date().toISOString(),
        details: { usage_percentage: memoryMetrics.usage_percentage },
      });
    }

    const performance = this.getPerformanceMetrics();
    if (performance.avg_response_time > 1000) {
      alerts.push({
        level: 'warning',
        message: `High average response time: ${performance.avg_response_time}ms`,
        service: 'performance',
        timestamp: new Date().toISOString(),
        details: { avg_response_time: performance.avg_response_time },
      });
    }

    if (performance.error_rate > 0.05) {
      alerts.push({
        level: 'critical',
        message: `High error rate: ${(performance.error_rate * 100).toFixed(2)}%`,
        service: 'application',
        timestamp: new Date().toISOString(),
        details: { error_rate: performance.error_rate },
      });
    }

    return alerts;
  }

  /**
   * Calcula status geral baseado nos status dos serviços
   */
  private calculateOverallStatus(services: ServiceHealth[]): 'healthy' | 'degraded' | 'unhealthy' {
    const statuses = services.map(s => s.status);

    if (statuses.includes('unhealthy')) {
      return 'unhealthy';
    }

    if (statuses.includes('degraded')) {
      return 'degraded';
    }

    return 'healthy';
  }

  /**
   * Extrai valor do resultado de Promise.allSettled
   */
  private getResultValue(result: PromiseSettledResult<ServiceHealth>): ServiceHealth {
    if (result.status === 'fulfilled') {
      return result.value;
    }

    return {
      status: 'unhealthy',
      error: result.reason?.message || 'Unknown error',
      last_check: new Date().toISOString(),
    };
  }

  /**
   * Inicia coleta de métricas de sistema
   */
  private startSystemMetricsCollection(): void {
    // Coleta métricas a cada 30 segundos
    setInterval(() => {
      const metrics = {
        memory: this.getMemoryMetrics(),
        system: this.getSystemLoadMetrics(),
        performance: this.getPerformanceMetrics(),
      };

      this.logger.metric('system_memory_usage', metrics.memory.usage_percentage, 'percent');
      this.logger.metric('system_cpu_usage', metrics.system.cpu_usage_percentage, 'percent');
      this.logger.metric('avg_response_time', metrics.performance.avg_response_time, 'ms');
      this.logger.metric('requests_per_second', metrics.performance.requests_per_second, 'rps');

    }, 30000);
  }
}
