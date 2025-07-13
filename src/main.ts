import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS configuration
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://neuralbook.com',
      process.env.FRONTEND_URL || 'http://localhost:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Swagger documentation
  if (process.env.ENABLE_SWAGGER === 'true' || process.env.NODE_ENV === 'development') {
    const config = new DocumentBuilder()
      .setTitle('NeuralContent API')
      .setDescription('Backend API for NeuralContent platform - Built with NestJS')
      .setVersion('1.0.0')
      .addBearerAuth()
      .addTag('Health', 'Health check endpoints')
      .addTag('Auth', 'Authentication endpoints')
      .addTag('Users', 'User management endpoints')
      .addTag('Plans', 'Plan management endpoints')
      .addTag('Payments', 'Payment processing endpoints')
      .addTag('Admin', 'Administrative endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(process.env.SWAGGER_PATH || 'docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  // Global prefix
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 NeuralContent API (NestJS) running on port ${port}`);
  console.log(`📖 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🏥 Health check: http://localhost:${port}/api/v1/health`);
  console.log(`📚 Documentation: http://localhost:${port}/${process.env.SWAGGER_PATH || 'docs'}`);
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start NeuralContent API:', error);
  process.exit(1);
});
