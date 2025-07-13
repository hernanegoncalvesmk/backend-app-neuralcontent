import { Controller, Get, Param, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { AppService } from './app.service';
import { DatabaseHealthService } from './database/database-health.service';
import { CacheService } from './shared/cache/cache.service';
import { LoggerService } from './shared/logger/logger.service';
import { 
  BusinessValidationException, 
  ResourceNotFoundException, 
  AuthenticationException,
  PaymentException 
} from './shared/exceptions/custom.exceptions';

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

  // Endpoints de teste para validar o tratamento de erros
  @Get('test/error/:type')
  testError(@Param('type') type: string) {
    this.logger.log(`Testing error type: ${type}`);
    
    switch (type) {
      case 'business':
        throw new BusinessValidationException('Teste de erro de validação de negócio', {
          field: 'testField',
          value: 'invalidValue'
        });
        
      case 'notfound':
        throw new ResourceNotFoundException('testResource', 'test123', {
          additionalInfo: 'Recurso de teste'
        });
        
      case 'auth':
        throw new AuthenticationException('Teste de erro de autenticação', {
          reason: 'invalid_token'
        });
        
      case 'payment':
        throw new PaymentException('Teste de erro de pagamento', 'stripe', 'test-tx-123', {
          amount: 100
        });
        
      case 'badrequest':
        throw new BadRequestException('Teste de BadRequest padrão do NestJS');
        
      case 'internal':
        throw new InternalServerErrorException('Teste de erro interno');
        
      case 'system':
        // Simula um erro de sistema não tratado
        throw new Error('Erro de sistema não tratado');
        
      default:
        throw new BusinessValidationException('Tipo de erro inválido para teste', {
          allowedTypes: ['business', 'notfound', 'auth', 'payment', 'badrequest', 'internal', 'system']
        });
    }
  }
}
