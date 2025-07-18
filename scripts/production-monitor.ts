#!/usr/bin/env ts-node

/**
 * Production Monitoring Script
 * NeuralContent API - Health Check and Performance Monitor
 * 
 * Este script monitora a saúde da aplicação em produção
 * e gera relatórios de performance e disponibilidade
 * 
 * Usage: npm run monitor:prod
 */

import { createConnection } from 'mysql2/promise';
import { createClient } from 'redis';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

interface HealthCheckResult {
  timestamp: string;
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  details?: any;
  error?: string;
}

interface MonitoringReport {
  timestamp: string;
  overall_status: 'healthy' | 'unhealthy' | 'degraded';
  services: HealthCheckResult[];
  performance_metrics: {
    avg_response_time: number;
    uptime_percentage: number;
    error_rate: number;
  };
  recommendations: string[];
}

class ProductionMonitor {
  private baseUrl: string;
  private dbConfig: any;
  private redisConfig: any;
  private results: HealthCheckResult[] = [];

  constructor() {
    this.baseUrl = process.env.BACKEND_URL || 'https://api.neuralbook.app';
    this.dbConfig = {
      host: process.env.DB_HOST || '167.235.253.236',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USERNAME || 'app_NeuralContent_8785',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'app_NeuralContent_8785'
    };
    this.redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379')
    };
  }

  private log(message: string, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO') {
    const timestamp = new Date().toISOString();
    const colorCode = level === 'ERROR' ? '\x1b[31m' : level === 'WARN' ? '\x1b[33m' : '\x1b[36m';
    console.log(`${colorCode}[${timestamp}] [${level}] ${message}\x1b[0m`);
  }

  private async measureResponseTime<T>(operation: () => Promise<T>): Promise<{ result: T; responseTime: number }> {
    const startTime = Date.now();
    try {
      const result = await operation();
      const responseTime = Date.now() - startTime;
      return { result, responseTime };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      throw { error, responseTime };
    }
  }

  async checkApiHealth(): Promise<HealthCheckResult> {
    this.log('Checking API health...');
    
    try {
      const { result, responseTime } = await this.measureResponseTime(async () => {
        return await axios.get(`${this.baseUrl}/v1/health`, {
          timeout: 10000,
          headers: {
            'User-Agent': 'NeuralContent-Monitor/1.0'
          }
        });
      });

      return {
        timestamp: new Date().toISOString(),
        service: 'api',
        status: result.status === 200 ? 'healthy' : 'degraded',
        responseTime,
        details: result.data
      };
    } catch (error: any) {
      return {
        timestamp: new Date().toISOString(),
        service: 'api',
        status: 'unhealthy',
        responseTime: error.responseTime || 0,
        error: error.message || 'Unknown API error'
      };
    }
  }

  async checkDatabaseHealth(): Promise<HealthCheckResult> {
    this.log('Checking database health...');
    
    try {
      const { result, responseTime } = await this.measureResponseTime(async () => {
        const connection = await createConnection(this.dbConfig);
        const [rows] = await connection.execute('SELECT 1 as status, NOW() as timestamp');
        await connection.end();
        return rows;
      });

      return {
        timestamp: new Date().toISOString(),
        service: 'database',
        status: 'healthy',
        responseTime,
        details: { connection_test: 'passed', result }
      };
    } catch (error: any) {
      return {
        timestamp: new Date().toISOString(),
        service: 'database',
        status: 'unhealthy',
        responseTime: error.responseTime || 0,
        error: error.message || 'Database connection failed'
      };
    }
  }

  async checkRedisHealth(): Promise<HealthCheckResult> {
    this.log('Checking Redis health...');
    
    try {
      const { result, responseTime } = await this.measureResponseTime(async () => {
        const client = createClient({
          socket: {
            host: this.redisConfig.host,
            port: this.redisConfig.port
          }
        });
        
        await client.connect();
        const pong = await client.ping();
        await client.disconnect();
        return pong;
      });

      return {
        timestamp: new Date().toISOString(),
        service: 'redis',
        status: result === 'PONG' ? 'healthy' : 'degraded',
        responseTime,
        details: { ping_result: result }
      };
    } catch (error: any) {
      return {
        timestamp: new Date().toISOString(),
        service: 'redis',
        status: 'unhealthy',
        responseTime: error.responseTime || 0,
        error: error.message || 'Redis connection failed'
      };
    }
  }

  async checkCriticalEndpoints(): Promise<HealthCheckResult[]> {
    this.log('Checking critical endpoints...');
    
    const endpoints = [
      { path: '/v1/auth/login', method: 'POST', name: 'auth-login' },
      { path: '/v1/users', method: 'GET', name: 'users-list' },
      { path: '/v1/plans', method: 'GET', name: 'plans-list' },
      { path: '/api/docs-json', method: 'GET', name: 'api-docs' }
    ];

    const results: HealthCheckResult[] = [];

    for (const endpoint of endpoints) {
      try {
        const { result, responseTime } = await this.measureResponseTime(async () => {
          return await axios({
            method: endpoint.method.toLowerCase() as any,
            url: `${this.baseUrl}${endpoint.path}`,
            timeout: 5000,
            validateStatus: (status) => status < 500 // Allow 4xx as they might be expected
          });
        });

        results.push({
          timestamp: new Date().toISOString(),
          service: `endpoint-${endpoint.name}`,
          status: result.status < 400 ? 'healthy' : 'degraded',
          responseTime,
          details: { status_code: result.status, endpoint: endpoint.path }
        });
      } catch (error: any) {
        results.push({
          timestamp: new Date().toISOString(),
          service: `endpoint-${endpoint.name}`,
          status: 'unhealthy',
          responseTime: error.responseTime || 0,
          error: `${endpoint.method} ${endpoint.path} failed: ${error.message}`
        });
      }
    }

    return results;
  }

  private generateRecommendations(results: HealthCheckResult[]): string[] {
    const recommendations: string[] = [];
    
    const unhealthyServices = results.filter(r => r.status === 'unhealthy');
    const slowServices = results.filter(r => r.responseTime > 5000);
    const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;

    if (unhealthyServices.length > 0) {
      recommendations.push(`⚠️ ${unhealthyServices.length} service(s) are unhealthy: ${unhealthyServices.map(s => s.service).join(', ')}`);
    }

    if (slowServices.length > 0) {
      recommendations.push(`🐌 ${slowServices.length} service(s) have slow response times (>5s): ${slowServices.map(s => s.service).join(', ')}`);
    }

    if (avgResponseTime > 2000) {
      recommendations.push('📈 Average response time is high. Consider optimizing database queries or adding caching');
    }

    if (results.some(r => r.service === 'database' && r.status !== 'healthy')) {
      recommendations.push('🗄️ Database issues detected. Check connection pool settings and query performance');
    }

    if (results.some(r => r.service === 'redis' && r.status !== 'healthy')) {
      recommendations.push('🔄 Redis cache issues detected. Verify Redis server status and memory usage');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ All systems are operating normally');
    }

    return recommendations;
  }

  private async saveReport(report: MonitoringReport): Promise<void> {
    const reportsDir = path.join(process.cwd(), 'monitoring', 'reports');
    
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const fileName = `health-report-${new Date().toISOString().split('T')[0]}.json`;
    const filePath = path.join(reportsDir, fileName);
    
    fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
    this.log(`Report saved to ${filePath}`);
  }

  async runFullHealthCheck(): Promise<MonitoringReport> {
    this.log('🚀 Starting production health check...');
    
    const startTime = Date.now();
    
    // Run all health checks
    const [apiHealth, dbHealth, redisHealth, ...endpointHealth] = await Promise.allSettled([
      this.checkApiHealth(),
      this.checkDatabaseHealth(),
      this.checkRedisHealth(),
      ...await this.checkCriticalEndpoints()
    ]);

    // Collect results
    const allResults: HealthCheckResult[] = [];
    
    [apiHealth, dbHealth, redisHealth, ...endpointHealth].forEach(result => {
      if (result.status === 'fulfilled') {
        if (Array.isArray(result.value)) {
          allResults.push(...result.value);
        } else {
          allResults.push(result.value);
        }
      }
    });

    // Calculate metrics
    const healthyCount = allResults.filter(r => r.status === 'healthy').length;
    const totalCount = allResults.length;
    const uptimePercentage = (healthyCount / totalCount) * 100;
    const avgResponseTime = allResults.reduce((sum, r) => sum + r.responseTime, 0) / totalCount;
    const errorRate = ((totalCount - healthyCount) / totalCount) * 100;

    // Determine overall status
    const unhealthyCount = allResults.filter(r => r.status === 'unhealthy').length;
    const degradedCount = allResults.filter(r => r.status === 'degraded').length;
    
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (unhealthyCount > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedCount > 0) {
      overallStatus = 'degraded';
    }

    const report: MonitoringReport = {
      timestamp: new Date().toISOString(),
      overall_status: overallStatus,
      services: allResults,
      performance_metrics: {
        avg_response_time: Math.round(avgResponseTime),
        uptime_percentage: Math.round(uptimePercentage * 100) / 100,
        error_rate: Math.round(errorRate * 100) / 100
      },
      recommendations: this.generateRecommendations(allResults)
    };

    await this.saveReport(report);
    
    const duration = Date.now() - startTime;
    this.log(`✅ Health check completed in ${duration}ms`);
    
    return report;
  }

  async displayReport(report: MonitoringReport): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log('🏥 NEURALCONTENT API - PRODUCTION HEALTH REPORT');
    console.log('='.repeat(60));
    console.log(`📅 Timestamp: ${report.timestamp}`);
    console.log(`🎯 Overall Status: ${report.overall_status.toUpperCase()}`);
    console.log(`⚡ Avg Response Time: ${report.performance_metrics.avg_response_time}ms`);
    console.log(`📊 Uptime: ${report.performance_metrics.uptime_percentage}%`);
    console.log(`❌ Error Rate: ${report.performance_metrics.error_rate}%`);
    
    console.log('\n📋 SERVICE STATUS:');
    report.services.forEach(service => {
      const statusEmoji = service.status === 'healthy' ? '✅' : service.status === 'degraded' ? '⚠️' : '❌';
      console.log(`  ${statusEmoji} ${service.service}: ${service.status} (${service.responseTime}ms)`);
      if (service.error) {
        console.log(`    └─ Error: ${service.error}`);
      }
    });

    console.log('\n💡 RECOMMENDATIONS:');
    report.recommendations.forEach(rec => {
      console.log(`  • ${rec}`);
    });
    
    console.log('\n' + '='.repeat(60) + '\n');
  }
}

// Execute monitoring if run directly
if (require.main === module) {
  async function main() {
    const monitor = new ProductionMonitor();
    
    try {
      const report = await monitor.runFullHealthCheck();
      await monitor.displayReport(report);
      
      // Exit with error code if system is unhealthy
      process.exit(report.overall_status === 'unhealthy' ? 1 : 0);
    } catch (error) {
      console.error('❌ Monitoring failed:', error);
      process.exit(1);
    }
  }
  
  main();
}

export { ProductionMonitor };
