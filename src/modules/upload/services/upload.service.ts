import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { extname } from 'path';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';

import { UploadedFile } from '../entities/uploaded-file.entity';
import { BackblazeService } from './backblaze.service';
import { ImageProcessingService } from './image-processing.service';
import { 
  UploadFileDto, 
  UploadMultipleDto, 
  UploadFromUrlDto,
  FileType,
  FileContext
} from '../dto/upload-file.dto';
import {
  FileResponseDto,
  MultipleFileResponseDto,
  DeleteFileResponseDto,
  UploadStatsDto,
} from '../dto/file-response.dto';
import { User } from '../../users/entities/user.entity';

export interface UploadedFileInfo {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly maxFileSize: number;
  private readonly allowedMimeTypes: string[];
  private readonly imageMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
  ];

  constructor(
    @InjectRepository(UploadedFile)
    private readonly uploadedFileRepository: Repository<UploadedFile>,
    private readonly backblazeService: BackblazeService,
    private readonly imageProcessingService: ImageProcessingService,
    private readonly configService: ConfigService,
  ) {
    this.maxFileSize = this.configService.get<number>('UPLOAD_MAX_FILE_SIZE') || 50 * 1024 * 1024; // 50MB
    this.allowedMimeTypes = this.configService.get<string>('UPLOAD_ALLOWED_TYPES')?.split(',') || [
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
    ];
  }

  /**
   * Upload de arquivo único
   */
  async uploadFile(
    fileInfo: UploadedFileInfo,
    uploadDto: UploadFileDto,
    user: User,
  ): Promise<FileResponseDto> {
    try {
      this.logger.log(`Iniciando upload de arquivo: ${fileInfo.originalname}`);

      // Validações
      this.validateFile(fileInfo);

      // Gerar identificadores únicos
      const fileId = uuidv4();
      const extension = extname(fileInfo.originalname).toLowerCase();
      const filename = `${fileId}${extension}`;

      let processedBuffer = fileInfo.buffer;
      let thumbnailBuffer: Buffer | null = null;
      let metadata: any = {};

      // Processar imagens se necessário
      if (this.imageMimeTypes.includes(fileInfo.mimetype)) {
        const processingOptions = {
          resize: uploadDto.maxWidth || uploadDto.maxHeight ? {
            width: uploadDto.maxWidth,
            height: uploadDto.maxHeight,
          } : undefined,
          optimize: uploadDto.processImage ?? true,
          quality: uploadDto.quality,
          format: fileInfo.mimetype.includes('jpeg') || fileInfo.mimetype.includes('jpg') ? 'jpeg' as const : 
                  fileInfo.mimetype.includes('png') ? 'png' as const :
                  fileInfo.mimetype.includes('webp') ? 'webp' as const : undefined,
        };

        const result = await this.imageProcessingService.processImage(
          fileInfo.buffer,
          processingOptions,
        );

        processedBuffer = result.processedBuffer;
        thumbnailBuffer = result.thumbnailBuffer || null;
        metadata = result.metadata;
      }

      // Upload para Backblaze
      const uploadResult = await this.backblazeService.uploadFile({
        fileName: filename,
        data: processedBuffer,
        contentType: fileInfo.mimetype,
        info: {
          originalName: fileInfo.originalname,
          userId: user.id.toString(),
          fileType: uploadDto.fileType?.toString() || FileType.OTHER,
          context: uploadDto.context?.toString() || FileContext.ATTACHMENT,
        },
      });

      // Upload do thumbnail se disponível
      let thumbnailUrl: string | null = null;
      if (thumbnailBuffer && uploadDto.createThumbnail) {
        const thumbnailFilename = `thumbs/${fileId}_thumb${extension}`;
        const thumbnailResult = await this.backblazeService.uploadFile({
          fileName: thumbnailFilename,
          data: thumbnailBuffer,
          contentType: fileInfo.mimetype,
          info: {
            originalName: `${fileInfo.originalname}_thumbnail`,
            userId: user.id.toString(),
            fileType: 'thumbnail',
            parentFileId: fileId,
          },
        });
        thumbnailUrl = thumbnailResult.url;
      }

      // Salvar no banco de dados
      const uploadedFile = this.uploadedFileRepository.create({
        originalName: fileInfo.originalname,
        filename,
        mimeType: fileInfo.mimetype,
        size: processedBuffer.length,
        url: uploadResult.url,
        thumbnailUrl: thumbnailUrl || undefined,
        type: uploadDto.fileType || FileType.OTHER,
        context: uploadDto.context || FileContext.ATTACHMENT,
        hash: this.generateHash(processedBuffer),
        metadata: {
          ...metadata,
          originalSize: fileInfo.size,
          processed: processedBuffer.length !== fileInfo.size,
          backblazeFileId: uploadResult.fileId,
        },
        uploadedBy: user.id,
        user,
      });

      await this.uploadedFileRepository.save(uploadedFile);

      this.logger.log(`Upload concluído: ${filename}`);

      return this.mapToFileResponse(uploadedFile);
    } catch (error) {
      this.logger.error(`Erro no upload: ${error.message}`);
      throw new InternalServerErrorException('Falha no upload do arquivo');
    }
  }

  /**
   * Upload de múltiplos arquivos
   */
  async uploadMultipleFiles(
    filesInfo: UploadedFileInfo[],
    uploadDto: UploadMultipleDto,
    user: User,
  ): Promise<MultipleFileResponseDto> {
    try {
      this.logger.log(`Iniciando upload de ${filesInfo.length} arquivos`);

      const results: FileResponseDto[] = [];
      const errors: string[] = [];

      for (const [index, fileInfo] of filesInfo.entries()) {
        try {
          const fileUploadDto: UploadFileDto = {
            fileType: uploadDto.fileType,
            context: uploadDto.context,
            processImage: uploadDto.processImage,
            maxWidth: uploadDto.maxWidth,
            maxHeight: uploadDto.maxHeight,
            quality: uploadDto.quality,
            createThumbnail: uploadDto.createThumbnail,
          };

          const result = await this.uploadFile(fileInfo, fileUploadDto, user);
          results.push(result);
        } catch (error) {
          const errorMessage = `Arquivo ${index + 1} (${fileInfo.originalname}): ${error.message}`;
          errors.push(errorMessage);
          this.logger.error(errorMessage);
        }
      }

      return {
        success: errors.length === 0,
        uploadedCount: results.length,
        totalCount: filesInfo.length,
        files: results,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      this.logger.error(`Erro no upload múltiplo: ${error.message}`);
      throw new InternalServerErrorException('Falha no upload dos arquivos');
    }
  }

  /**
   * Upload de arquivo via URL
   */
  async uploadFromUrl(
    uploadDto: UploadFromUrlDto,
    user: User,
  ): Promise<FileResponseDto> {
    try {
      this.logger.log(`Fazendo download de: ${uploadDto.url}`);

      // Download do arquivo
      const response = await axios.get(uploadDto.url, {
        responseType: 'arraybuffer',
        timeout: 30000,
        maxContentLength: this.maxFileSize,
      });

      const buffer = Buffer.from(response.data);
      const contentType = response.headers['content-type'] || 'application/octet-stream';
      
      // Extrair nome do arquivo da URL ou usar nome fornecido
      const urlPath = new URL(uploadDto.url).pathname;
      const originalname = uploadDto.filename || urlPath.split('/').pop() || 'downloaded-file';

      const fileInfo: UploadedFileInfo = {
        originalname,
        mimetype: contentType,
        buffer,
        size: buffer.length,
      };

      const fileUploadDto: UploadFileDto = {
        fileType: uploadDto.fileType,
        context: uploadDto.context,
        processImage: uploadDto.processImage,
        maxWidth: uploadDto.maxWidth,
        maxHeight: uploadDto.maxHeight,
        quality: uploadDto.quality,
        createThumbnail: uploadDto.createThumbnail,
      };

      return await this.uploadFile(fileInfo, fileUploadDto, user);
    } catch (error) {
      this.logger.error(`Erro no download/upload: ${error.message}`);
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new BadRequestException('URL inacessível ou inválida');
      }
      if (error.code === 'ETIMEDOUT') {
        throw new BadRequestException('Timeout no download do arquivo');
      }
      throw new InternalServerErrorException('Falha no download/upload do arquivo');
    }
  }

  /**
   * Obter arquivo por ID
   */
  async getFile(fileId: string, user?: User): Promise<UploadedFile> {
    const file = await this.uploadedFileRepository.findOne({
      where: { id: fileId },
      relations: ['user'],
    });

    if (!file) {
      throw new NotFoundException('Arquivo não encontrado');
    }

      // Verificar se o usuário tem acesso ao arquivo
      if (user && file.user && file.user.id !== user.id) {
        throw new NotFoundException('Arquivo não encontrado');
      }    return file;
  }

  /**
   * Listar arquivos do usuário
   */
  async getUserFiles(
    user: User,
    fileType?: string,
    context?: string,
    page = 1,
    limit = 20,
  ): Promise<{ files: FileResponseDto[]; total: number; page: number; limit: number }> {
    const query = this.uploadedFileRepository
      .createQueryBuilder('file')
      .where('file.userId = :userId', { userId: user.id });

    if (fileType) {
      query.andWhere('file.fileType = :fileType', { fileType });
    }

    if (context) {
      query.andWhere('file.context = :context', { context });
    }

    query
      .orderBy('file.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [files, total] = await query.getManyAndCount();

    return {
      files: files.map(file => this.mapToFileResponse(file)),
      total,
      page,
      limit,
    };
  }

  /**
   * Deletar arquivo
   */
  async deleteFile(fileId: string, user: User): Promise<DeleteFileResponseDto> {
    try {
      const file = await this.getFile(fileId, user);

      // Deletar do Backblaze
      const backblazeFileId = file.metadata?.backblazeFileId;
      if (backblazeFileId) {
        await this.backblazeService.deleteFile(backblazeFileId);
      }

      // Deletar thumbnail se existir
      if (file.thumbnailUrl) {
        const thumbnailFileId = file.metadata?.thumbnailBackblazeFileId;
        if (thumbnailFileId) {
          await this.backblazeService.deleteFile(thumbnailFileId);
        }
      }

      // Soft delete no banco
      await this.uploadedFileRepository.softDelete(fileId);

      this.logger.log(`Arquivo deletado: ${file.filename}`);

      return {
        success: true,
        fileId,
        message: 'Arquivo deletado com sucesso',
      };
    } catch (error) {
      this.logger.error(`Erro ao deletar arquivo: ${error.message}`);
      throw new InternalServerErrorException('Falha ao deletar arquivo');
    }
  }

  /**
   * Obter estatísticas de upload do usuário
   */
  async getUploadStats(user: User): Promise<UploadStatsDto> {
    const query = this.uploadedFileRepository
      .createQueryBuilder('file')
      .where('file.userId = :userId', { userId: user.id });

    const [totalFiles, totalSizeResult] = await Promise.all([
      query.getCount(),
      query.select('SUM(file.size)', 'totalSize').getRawOne(),
    ]);

    const totalSize = parseInt(totalSizeResult?.totalSize || '0');

    // Estatísticas por tipo
    const typeStats = await query
      .select('file.fileType', 'fileType')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(file.size)', 'size')
      .groupBy('file.fileType')
      .getRawMany();

    return {
      totalFiles,
      totalSize,
      typeBreakdown: typeStats.map(stat => ({
        fileType: stat.fileType,
        count: parseInt(stat.count),
        size: parseInt(stat.size || '0'),
      })),
    };
  }

  /**
   * Validar arquivo
   */
  private validateFile(fileInfo: UploadedFileInfo): void {
    // Verificar tamanho
    if (fileInfo.size > this.maxFileSize) {
      throw new BadRequestException(
        `Arquivo muito grande. Tamanho máximo: ${this.maxFileSize / 1024 / 1024}MB`,
      );
    }

    // Verificar tipo MIME
    if (!this.allowedMimeTypes.includes(fileInfo.mimetype)) {
      throw new BadRequestException(
        `Tipo de arquivo não permitido: ${fileInfo.mimetype}`,
      );
    }

    // Verificar se o arquivo não está vazio
    if (fileInfo.size === 0) {
      throw new BadRequestException('Arquivo está vazio');
    }
  }

  /**
   * Mapear entidade para DTO de resposta
   */
  private mapToFileResponse(file: UploadedFile): FileResponseDto {
    return {
      id: file.id,
      originalName: file.originalName,
      filename: file.filename,
      mimeType: file.mimeType,
      size: file.size,
      url: file.url,
      thumbnailUrl: file.thumbnailUrl,
      fileType: file.type,
      context: file.context,
      metadata: file.metadata,
      uploadedAt: file.createdAt,
    };
  }

  /**
   * Gerar hash MD5 do arquivo
   */
  private generateHash(buffer: Buffer): string {
    return createHash('md5').update(buffer).digest('hex');
  }
}
