import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import redisConfig from './config/redis.config';
import { EnvironmentVariables } from './config/env.validation';
import { validateConfig } from './config/validate-config';
import { DatabaseModule } from './database/database.module';
import { CacheModule } from './shared/cache/cache.module';

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
export class AppModule {}
