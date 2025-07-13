import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { DatabaseHealthService } from './database/database-health.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly databaseHealthService: DatabaseHealthService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async getHealth() {
    const databaseInfo = await this.databaseHealthService.getDatabaseInfo();
    const performanceTest = await this.databaseHealthService.performanceTest();
    
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: databaseInfo,
      performance: performanceTest,
    };
  }

  @Get('health/database')
  async getDatabaseHealth() {
    return await this.databaseHealthService.getDatabaseInfo();
  }
}
