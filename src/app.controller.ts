import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { DatabaseHealthService } from './database/database-health.service';
import { CacheService } from './shared/cache/cache.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly databaseHealthService: DatabaseHealthService,
    private readonly cacheService: CacheService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async getHealth() {
    const databaseInfo = await this.databaseHealthService.getDatabaseInfo();
    const performanceTest = await this.databaseHealthService.performanceTest();
    const cacheHealth = await this.cacheService.healthCheck();
    const cacheMetrics = this.cacheService.getMetrics();
    
    return {
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
