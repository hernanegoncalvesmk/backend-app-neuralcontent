import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { DatabaseModule } from '../../database/database.module';
import { CacheModule } from '../cache/cache.module';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [
    DatabaseModule,
    CacheModule,
    LoggerModule,
  ],
  controllers: [HealthController],
  providers: [],
  exports: [],
})
export class HealthModule {}
