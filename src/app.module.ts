import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR, APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { entities } from './models/entities';

// Common imports
import {
  LoggingInterceptor,
  TransformInterceptor,
  TimeoutInterceptor,
  AllExceptionsFilter,
  ValidationExceptionFilter,
} from './common';

@Module({
  imports: [
    // Configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Database module
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'mysql',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT!, 10) || 3306,
        username: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        entities: entities,
        synchronize: false, // Never true in production
        logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
        
        // Connection pool settings
        extra: {
          connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT!, 10) || 10,
          acquireTimeout: parseInt(process.env.DB_TIMEOUT!, 10) || 60000,
          timeout: parseInt(process.env.DB_TIMEOUT!, 10) || 60000,
          reconnect: true,
          debug: false,
        },
        
        // Cache settings
        cache: {
          duration: 30000, // 30 seconds
        },
      }),
    }),
    
    // Feature modules will be added here
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    
    // Global Interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TimeoutInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    
    // Global Exception Filters
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: ValidationExceptionFilter,
    },
  ],
})
export class AppModule {}
