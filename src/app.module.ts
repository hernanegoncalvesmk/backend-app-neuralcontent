import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import redisConfig from './config/redis.config';
import { EnvironmentVariables } from './config/env.validation';
import { validateConfig } from './config/validate-config';
import { DatabaseModule } from './database/database.module';
import { CacheModule } from './shared/cache/cache.module';
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SecurityMiddleware)
      .forRoutes('*'); // Aplicar a todas as rotas
  }
}
