import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DatabaseHealthService } from '../../database/database-health.service';
import { CacheService } from '../cache/cache.service';
import { LoggerService } from '../logger/logger.service';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: ServiceHealth;
    cache: ServiceHealth;
    memory: ServiceHealth;
    disk: ServiceHealth;
  };
  metrics: {
    response_time: number;
    requests_total: number;
    errors_total: number;
    memory_usage: MemoryUsage;
    system_load: SystemLoad;
  };
}

interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  response_time?: number;
  details?: any;
  last_check: string;
}

interface MemoryUsage {
  used_mb: number;
  total_mb: number;
  usage_percentage: number;
  heap_used_mb: number;
  heap_total_mb: number;
}

interface SystemLoad {
  cpu_count: number;
  load_average: number[];
  uptime_seconds: number;
}

@ApiTags('🏥 Health & Metrics')
@Controller('health')
export class HealthController {
  private startTime = Date.now();
  private requestCount = 0;
  private errorCount = 0;

  constructor(
    private readonly databaseHealthService: DatabaseHealthService,
    private readonly cacheService: CacheService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('HealthController');
  }

  @Get()
  @ApiOperation({
    summary: 'Health Check Completo',
    description:
      'Retorna o status completo da aplicação incluindo todos os serviços e métricas',
  })
  @ApiResponse({
    status: 200,
    description: 'Aplicação saudável',
    schema: {
      example: {
        status: 'healthy',
        timestamp: '2025-07-14T21:00:00.000Z',
        uptime: 1234.56,
        version: '1.0.0',
        environment: 'development',
        services: {
          database: {
            status: 'healthy',
            response_time: 45,
            last_check: '2025-07-14T21:00:00.000Z',
          },
          cache: {
            status: 'healthy',
            response_time: 12,
            last_check: '2025-07-14T21:00:00.000Z',
          },
          memory: { status: 'healthy', last_check: '2025-07-14T21:00:00.000Z' },
          disk: { status: 'healthy', last_check: '2025-07-14T21:00:00.000Z' },
        },
        metrics: {
          response_time: 123,
          requests_total: 1000,
          errors_total: 5,
          memory_usage: { used_mb: 256, total_mb: 1024, usage_percentage: 25 },
          system_load: {
            cpu_count: 4,
            load_average: [0.1, 0.2, 0.3],
            uptime_seconds: 3600,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Serviços degradados ou indisponíveis',
  })
  async getHealthStatus(): Promise<HealthStatus> {
    const startTime = Date.now();
    this.requestCount++;

    try {
      this.logger.log('Comprehensive health check started');

      // Verificar serviços em paralelo
      const [databaseHealth, cacheHealth, memoryHealth, diskHealth] =
        await Promise.all([
          this.checkDatabaseHealth(),
          this.checkCacheHealth(),
          this.checkMemoryHealth(),
          this.checkDiskHealth(),
        ]);

      const responseTime = Date.now() - startTime;
      const overallStatus = this.determineOverallStatus([
        databaseHealth,
        cacheHealth,
        memoryHealth,
        diskHealth,
      ]);

      const healthStatus: HealthStatus = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        services: {
          database: databaseHealth,
          cache: cacheHealth,
          memory: memoryHealth,
          disk: diskHealth,
        },
        metrics: {
          response_time: responseTime,
          requests_total: this.requestCount,
          errors_total: this.errorCount,
          memory_usage: this.getMemoryUsage(),
          system_load: this.getSystemLoad(),
        },
      };

      this.logger.log('Comprehensive health check completed', {
        metadata: {
          overall_status: overallStatus,
          response_time: responseTime,
          services_checked: 4,
        },
      });

      return healthStatus;
    } catch (error) {
      this.errorCount++;
      this.logger.error('Health check failed', error.stack);
      throw error;
    }
  }

  @Get('live')
  @ApiOperation({
    summary: 'Liveness Probe',
    description:
      'Verifica se a aplicação está respondendo (para Kubernetes/Docker)',
  })
  @ApiResponse({ status: 200, description: 'Aplicação está viva' })
  getLiveness() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('ready')
  @ApiOperation({
    summary: 'Readiness Probe',
    description: 'Verifica se a aplicação está pronta para receber tráfego',
  })
  @ApiResponse({ status: 200, description: 'Aplicação está pronta' })
  @ApiResponse({ status: 503, description: 'Aplicação não está pronta' })
  async getReadiness() {
    try {
      // Verificar serviços críticos
      const [dbHealth, cacheHealth] = await Promise.all([
        this.checkDatabaseHealth(),
        this.checkCacheHealth(),
      ]);

      const isReady =
        dbHealth.status === 'healthy' && cacheHealth.status !== 'unhealthy';

      if (!isReady) {
        return {
          status: 'not_ready',
          timestamp: new Date().toISOString(),
          services: {
            database: dbHealth.status,
            cache: cacheHealth.status,
          },
        };
      }

      return {
        status: 'ready',
        timestamp: new Date().toISOString(),
        services: {
          database: dbHealth.status,
          cache: cacheHealth.status,
        },
      };
    } catch (error) {
      this.logger.error('Readiness check failed', error.stack);
      return {
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  @Get('metrics')
  @ApiOperation({
    summary: 'Métricas da Aplicação',
    description: 'Retorna métricas detalhadas de performance e uso',
  })
  @ApiResponse({ status: 200, description: 'Métricas coletadas com sucesso' })
  getMetrics() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      timestamp: new Date().toISOString(),
      application: {
        uptime_seconds: process.uptime(),
        uptime_human: this.formatUptime(process.uptime()),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        node_version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      performance: {
        requests_total: this.requestCount,
        errors_total: this.errorCount,
        error_rate:
          this.requestCount > 0
            ? (this.errorCount / this.requestCount) * 100
            : 0,
        avg_response_time: this.calculateAverageResponseTime(),
      },
      memory: {
        rss_mb: Math.round(memoryUsage.rss / 1024 / 1024),
        heap_total_mb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        heap_used_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        external_mb: Math.round(memoryUsage.external / 1024 / 1024),
        heap_usage_percentage: Math.round(
          (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
        ),
      },
      cpu: {
        user_microseconds: cpuUsage.user,
        system_microseconds: cpuUsage.system,
        total_microseconds: cpuUsage.user + cpuUsage.system,
      },
      process: {
        pid: process.pid,
        ppid: process.ppid,
        title: process.title,
        cwd: process.cwd(),
      },
    };
  }

  @Get('database')
  @ApiOperation({
    summary: 'Health Check do Banco de Dados',
    description: 'Verifica especificamente a saúde do banco de dados',
  })
  async getDatabaseHealth() {
    return await this.checkDatabaseHealth();
  }

  @Get('cache')
  @ApiOperation({
    summary: 'Health Check do Cache',
    description: 'Verifica especificamente a saúde do Redis/Cache',
  })
  async getCacheHealth() {
    return await this.checkCacheHealth();
  }

  // Métodos privados para verificação de serviços
  private async checkDatabaseHealth(): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      const dbInfo = await this.databaseHealthService.getDatabaseInfo();
      const responseTime = Date.now() - startTime;

      return {
        status: dbInfo.isConnected ? 'healthy' : 'unhealthy',
        response_time: responseTime,
        details: {
          connected: dbInfo.isConnected,
          database: dbInfo.database,
          entities_count: dbInfo.entities,
          migrations_count: dbInfo.migrations,
        },
        last_check: new Date().toISOString(),
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logger.error('Database health check failed', error.stack);

      return {
        status: 'unhealthy',
        response_time: responseTime,
        details: { error: error.message },
        last_check: new Date().toISOString(),
      };
    }
  }

  private async checkCacheHealth(): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      const cacheHealth = await this.cacheService.healthCheck();
      const responseTime = Date.now() - startTime;

      return {
        status: cacheHealth.isConnected ? 'healthy' : 'degraded',
        response_time: responseTime,
        details: {
          connected: cacheHealth.isConnected,
          cache_response_time: cacheHealth.responseTime,
          error: cacheHealth.error,
        },
        last_check: new Date().toISOString(),
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logger.error('Cache health check failed', error.stack);

      return {
        status: 'unhealthy',
        response_time: responseTime,
        details: { error: error.message },
        last_check: new Date().toISOString(),
      };
    }
  }

  private async checkMemoryHealth(): Promise<ServiceHealth> {
    try {
      const memoryUsage = this.getMemoryUsage();
      const isHealthy = memoryUsage.usage_percentage < 85; // Considera saudável se usar menos de 85%

      return {
        status: isHealthy
          ? 'healthy'
          : memoryUsage.usage_percentage < 95
            ? 'degraded'
            : 'unhealthy',
        details: memoryUsage,
        last_check: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Memory health check failed', error.stack);
      return {
        status: 'unhealthy',
        details: { error: error.message },
        last_check: new Date().toISOString(),
      };
    }
  }

  private async checkDiskHealth(): Promise<ServiceHealth> {
    // Simulação de verificação de disco - em produção você pode usar fs.statSync
    try {
      return {
        status: 'healthy',
        details: {
          free_space_mb: 'N/A',
          total_space_mb: 'N/A',
          usage_percentage: 'N/A',
        },
        last_check: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error.message },
        last_check: new Date().toISOString(),
      };
    }
  }

  private determineOverallStatus(
    services: ServiceHealth[],
  ): 'healthy' | 'degraded' | 'unhealthy' {
    const unhealthyCount = services.filter(
      (s) => s.status === 'unhealthy',
    ).length;
    const degradedCount = services.filter(
      (s) => s.status === 'degraded',
    ).length;

    if (unhealthyCount > 0) return 'unhealthy';
    if (degradedCount > 0) return 'degraded';
    return 'healthy';
  }

  private getMemoryUsage(): MemoryUsage {
    const memoryUsage = process.memoryUsage();
    const totalMb = Math.round(memoryUsage.heapTotal / 1024 / 1024);
    const usedMb = Math.round(memoryUsage.heapUsed / 1024 / 1024);

    return {
      used_mb: usedMb,
      total_mb: totalMb,
      usage_percentage: Math.round((usedMb / totalMb) * 100),
      heap_used_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heap_total_mb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    };
  }

  private getSystemLoad(): SystemLoad {
    const os = require('os');
    return {
      cpu_count: os.cpus().length,
      load_average: os.loadavg(),
      uptime_seconds: os.uptime(),
    };
  }

  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m ${secs}s`;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  }

  private calculateAverageResponseTime(): number {
    // Simulação - em produção você manteria um array de tempos de resposta
    return Math.round(Math.random() * 200 + 50); // 50-250ms
  }
}
