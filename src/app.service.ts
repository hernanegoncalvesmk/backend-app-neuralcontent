import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getApiInfo(): object {
    return {
      message: 'NeuralContent API v1.0.0 - NestJS',
      documentation: '/docs',
      health: '/health',
      framework: 'NestJS',
      version: process.env.npm_package_version || '1.0.0',
    };
  }

  getHealthCheck(): object {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      framework: 'NestJS',
    };
  }
}
