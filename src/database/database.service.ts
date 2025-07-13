import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async checkDatabaseHealth(): Promise<{ status: string; details: any }> {
    try {
      // Test database connection
      await this.dataSource.query('SELECT 1 as test');
      
      return {
        status: 'healthy',
        details: {
          connected: this.dataSource.isInitialized,
          host: process.env.DB_HOST,
          database: process.env.DB_NAME,
          driver: 'mysql2',
          orm: 'TypeORM with NestJS',
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  async getConnectionInfo(): Promise<object> {
    return {
      databaseType: 'MySQL',
      orm: 'TypeORM',
      framework: 'NestJS',
      host: process.env.DB_HOST,
      databaseName: process.env.DB_NAME,
      isConnected: this.dataSource.isInitialized,
    };
  }
}
