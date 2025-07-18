import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerService } from './logger.service';
import { WinstonLoggerService } from './winston-logger.service';

/**
 * Módulo global de logging para NeuralContent
 * Fornece os serviços de log Winston e Legacy em toda a aplicação
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    LoggerService,
    WinstonLoggerService,
    {
      provide: 'WINSTON_LOGGER',
      useExisting: WinstonLoggerService,
    },
  ],
  exports: [LoggerService, WinstonLoggerService, 'WINSTON_LOGGER'],
})
export class LoggerModule {}
