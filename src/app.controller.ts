import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { DatabaseHealthService } from './database/database-health.service';
import { CacheService } from './shared/cache/cache.service';
import { LoggerService } from './shared/logger/logger.service';

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
  getHello(): string {
    this.logger.log('Hello endpoint accessed');
    return this.appService.getHello();
  }

  @Get('health')
  async getHealth() {
    this.logger.log('Health check requested');
    
    try {
      const databaseInfo = await this.databaseHealthService.getDatabaseInfo();
      const performanceTest = await this.databaseHealthService.performanceTest();
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
        }
      });

      return healthData;
    } catch (error) {
      this.logger.error('Health check failed', error.stack, {
        error: {
          name: error.name,
          message: error.message,
        }
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
}
