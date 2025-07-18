import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { UploadController } from './controllers/upload.controller';
import { UploadService } from './services/upload.service';
import { BackblazeService } from './services/backblaze.service';
import { ImageProcessingService } from './services/image-processing.service';
import { UploadedFile } from './entities/uploaded-file.entity';

/**
 * Módulo de Upload
 * 
 * @description Módulo responsável pelo gerenciamento de upload de arquivos
 * @author NeuralContent Team
 * @since 1.0.0
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([UploadedFile]),
    ConfigModule,
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
        files: 10, // Máximo 10 arquivos
      },
      fileFilter: (req, file, callback) => {
        // Lista de tipos MIME permitidos
        const allowedMimeTypes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
          'image/gif',
          'image/svg+xml',
          'application/pdf',
          'text/plain',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'application/zip',
          'application/x-zip-compressed',
          'application/x-rar-compressed',
          'video/mp4',
          'video/mpeg',
          'video/quicktime',
          'audio/mpeg',
          'audio/wav',
          'audio/mp4',
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(new Error(`Tipo de arquivo não permitido: ${file.mimetype}`), false);
        }
      },
    }),
  ],
  controllers: [UploadController],
  providers: [
    UploadService,
    BackblazeService,
    ImageProcessingService,
  ],
  exports: [
    UploadService,
    BackblazeService,
    ImageProcessingService,
  ],
})
export class UploadModule {}
