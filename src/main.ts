import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { LoggerService } from './shared/logger/logger.service';
import { setupSwagger } from './config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // Buffer logs until custom logger is ready
  });
  
  const configService = app.get(ConfigService);
  const logger = app.get(LoggerService);
  logger.setContext('Bootstrap');

  // Use custom logger
  app.useLogger(logger);

  // Get configuration values
  const port = configService.get<number>('app.port', 3001);
  const apiPrefix = configService.get<string>('app.apiPrefix', 'v1');
  const nodeEnv = configService.get<string>('app.nodeEnv', 'development');

  // Set global prefix for all routes
  app.setGlobalPrefix(apiPrefix);

  // Enable validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Setup Swagger documentation
  setupSwagger(app);

  // Graceful shutdown handling
  process.on('SIGTERM', async () => {
    logger.logShutdown('SIGTERM');
    await app.close();
  });

  process.on('SIGINT', async () => {
    logger.logShutdown('SIGINT');
    await app.close();
  });

  // Start the application
  await app.listen(port);

  // Log startup information using custom logger
  logger.logStartup(port, nodeEnv);
  logger.log(`📋 API Prefix: /${apiPrefix}`);
  logger.log(`🔧 Configuration loaded and validated successfully`);
}

bootstrap().catch((error) => {
  // Fallback logger for bootstrap errors
  console.error('❌ Failed to start application:', error.message);
  console.error(error.stack);
  process.exit(1);
});
