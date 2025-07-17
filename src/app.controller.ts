import {
  Controller,
  Get,
  Param,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { DatabaseHealthService } from './database/database-health.service';
import { CacheService } from './shared/cache/cache.service';
import { LoggerService } from './shared/logger/logger.service';
import {
  BusinessValidationException,
  ResourceNotFoundException,
  AuthenticationException,
  PaymentException,
} from './shared/exceptions/custom.exceptions';

@ApiTags('✅ Aplicações')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly databaseHealthService: DatabaseHealthService,
    private readonly cacheService: CacheService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('AppController');
  }

  @Get()
  getHello() {
    this.logger.log('Hello endpoint accessed');
    const baseInfo = this.appService.getHello();

    return {
      message: baseInfo,
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      api: 'NeuralContent API',
      status: 'online',
    };
  }

  @Get('health')
  async getHealth() {
    this.logger.log('Health check requested');

    try {
      const databaseInfo = await this.databaseHealthService.getDatabaseInfo();
      const performanceTest =
        await this.databaseHealthService.performanceTest();
      const cacheHealth = await this.cacheService.healthCheck();
      const cacheMetrics = this.cacheService.getMetrics();

      const healthData = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: databaseInfo,
        performance: performanceTest,
        cache: {
          redis: cacheHealth,
          metrics: cacheMetrics,
        },
      };

      this.logger.log('Health check completed successfully', {
        metadata: {
          databaseConnected: databaseInfo.isConnected,
          cacheConnected: cacheHealth.isConnected,
          uptime: process.uptime(),
        },
      });

      return healthData;
    } catch (error) {
      this.logger.error('Health check failed', error.stack, {
        error: {
          name: error.name,
          message: error.message,
        },
      });
      throw error;
    }
  }

  @Get('health/database')
  async getDatabaseHealth() {
    return await this.databaseHealthService.getDatabaseInfo();
  }

  @Get('health/cache')
  async getCacheHealth() {
    const health = await this.cacheService.healthCheck();
    const metrics = this.cacheService.getMetrics();

    return {
      redis: health,
      metrics,
    };
  }

  @Get('health/live')
  @ApiOperation({
    summary: 'Liveness Probe',
    description:
      'Verifica se a aplicação está respondendo (para Kubernetes/Docker)',
  })
  @ApiResponse({ status: 200, description: 'Aplicação está viva' })
  async getLiveness() {
    this.logger.log('Liveness probe requested');
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      pid: process.pid,
      version: '1.0.0',
    };
  }

  @Get('health/ready')
  @ApiOperation({
    summary: 'Readiness Probe',
    description: 'Verifica se a aplicação está pronta para receber tráfego',
  })
  @ApiResponse({ status: 200, description: 'Aplicação está pronta' })
  @ApiResponse({ status: 503, description: 'Aplicação não está pronta' })
  async getReadiness() {
    this.logger.log('Readiness probe requested');
    try {
      const dbInfo = await this.databaseHealthService.getDatabaseInfo();
      const cacheHealth = await this.cacheService.healthCheck();

      const isReady = dbInfo.isConnected && cacheHealth.isConnected;

      return {
        status: isReady ? 'ready' : 'not_ready',
        timestamp: new Date().toISOString(),
        services: {
          database: dbInfo.isConnected ? 'healthy' : 'unhealthy',
          cache: cacheHealth.isConnected ? 'healthy' : 'unhealthy',
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
    description:
      'Retorna métricas detalhadas de performance, memória, CPU e sistema',
  })
  @ApiResponse({ status: 200, description: 'Métricas coletadas com sucesso' })
  async getMetrics() {
    this.logger.log('Application metrics requested');

    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const cacheMetrics = this.cacheService.getMetrics();

    return {
      timestamp: new Date().toISOString(),
      application: {
        name: 'NeuralContent API',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime_seconds: process.uptime(),
        uptime_human: this.formatUptime(process.uptime()),
        node_version: process.version,
        platform: process.platform,
        arch: process.arch,
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
      cache: cacheMetrics,
      process: {
        pid: process.pid,
        ppid: process.ppid,
        title: process.title,
        cwd: process.cwd(),
      },
      system: {
        cpu_count: require('os').cpus().length,
        load_average: require('os').loadavg(),
        total_memory_mb: Math.round(require('os').totalmem() / 1024 / 1024),
        free_memory_mb: Math.round(require('os').freemem() / 1024 / 1024),
        hostname: require('os').hostname(),
        platform: require('os').platform(),
        release: require('os').release(),
      },
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

  // Endpoints de teste para validar o tratamento de erros
  @Get('test/error/:type')
  testError(@Param('type') type: string) {
    this.logger.log(`Testing error type: ${type}`);

    switch (type) {
      case 'business':
        throw new BusinessValidationException(
          'Teste de erro de validação de negócio',
          {
            field: 'testField',
            value: 'invalidValue',
          },
        );

      case 'notfound':
        throw new ResourceNotFoundException('testResource', 'test123', {
          additionalInfo: 'Recurso de teste',
        });

      case 'auth':
        throw new AuthenticationException('Teste de erro de autenticação', {
          reason: 'invalid_token',
        });

      case 'payment':
        throw new PaymentException(
          'Teste de erro de pagamento',
          'stripe',
          'test-tx-123',
          {
            amount: 100,
          },
        );

      case 'badrequest':
        throw new BadRequestException('Teste de BadRequest padrão do NestJS');

      case 'internal':
        throw new InternalServerErrorException('Teste de erro interno');

      case 'system':
        // Simula um erro de sistema não tratado
        throw new Error('Erro de sistema não tratado');

      default:
        throw new BusinessValidationException(
          'Tipo de erro inválido para teste',
          {
            allowedTypes: [
              'business',
              'notfound',
              'auth',
              'payment',
              'badrequest',
              'internal',
              'system',
            ],
          },
        );
    }
  }
}
