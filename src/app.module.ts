import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
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
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
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
