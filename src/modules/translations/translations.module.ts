import { Module } from '@nestjs/common';
import { TranslationsService } from './translations.service';
import { TranslationsController } from './translations.controller';

@Module({
  providers: [TranslationsService],
  controllers: [TranslationsController]
})
export class TranslationsModule {}
