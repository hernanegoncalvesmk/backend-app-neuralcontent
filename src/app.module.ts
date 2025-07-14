import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import redisConfig from './config/redis.config';
import { EnvironmentVariables } from './config/env.validation';
import { validateConfig } from './config/validate-config';
import { DatabaseModule } from './database/database.module';
import { CacheModule } from './shared/cache/cache.module';
import { LoggerModule } from './shared/logger/logger.module';
import { LoggingInterceptor } from './shared/interceptors/logging.interceptor';
import { SecurityMiddleware } from './shared/middleware/security.middleware';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { AllExceptionsFilter } from './shared/filters/all-exceptions.filter';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PlansModule } from './modules/plans/plans.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration, redisConfig],
      envFilePath: '.env',
      validate: (config: Record<string, unknown>) => {
        return validateConfig(EnvironmentVariables, config);
      },
    }),
    DatabaseModule,
    CacheModule,
    LoggerModule,
    AuthModule,
    UsersModule,
    PlansModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SecurityMiddleware)
      .forRoutes('*'); // Aplicar a todas as rotas
  }
}
