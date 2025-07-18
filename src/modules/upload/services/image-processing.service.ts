import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../../shared/logger/logger.service';
import * as sharp from 'sharp';
import * as crypto from 'crypto';
import * as path from 'path';

/**
 * Opções de processamento de imagem
 */
export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
  createThumbnail?: boolean;
  thumbnailSize?: number;
  removeMetadata?: boolean;
  optimize?: boolean;
}

/**
 * Resultado do processamento
 */
export interface ProcessingResult {
  originalBuffer: Buffer;
  processedBuffer: Buffer;
  thumbnailBuffer?: Buffer;
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;
    colorspace: string;
    hasAlpha: boolean;
    density?: number;
  };
  hash: string;
}

/**
 * Serviço de Processamento de Imagens
 * 
 * @description Responsável por redimensionar, otimizar e processar imagens
 * @author NeuralContent Team
 * @since 1.0.0
 */
@Injectable()
export class ImageProcessingService {
  private readonly SUPPORTED_FORMATS = ['jpeg', 'jpg', 'png', 'webp', 'gif', 'tiff', 'svg', 'avif'];
  private readonly DEFAULT_QUALITY = 80;
  private readonly DEFAULT_MAX_WIDTH = 1920;
  private readonly DEFAULT_MAX_HEIGHT = 1080;
  private readonly DEFAULT_THUMBNAIL_SIZE = 300;

  constructor(private readonly logger: LoggerService) {
    this.logger.setContext('ImageProcessingService');
  }

  /**
   * Verifica se o arquivo é uma imagem suportada
   */
  isImageSupported(mimeType: string, filename?: string): boolean {
    // Verificar por MIME type
    if (mimeType.startsWith('image/')) {
      const format = mimeType.split('/')[1];
      if (this.SUPPORTED_FORMATS.includes(format)) {
        return true;
      }
    }

    // Verificar por extensão (fallback)
    if (filename) {
      const ext = path.extname(filename).toLowerCase().substring(1);
      return this.SUPPORTED_FORMATS.includes(ext);
    }

    return false;
  }

  /**
   * Processa uma imagem
   */
  async processImage(
    buffer: Buffer,
    options: ImageProcessingOptions = {}
  ): Promise<ProcessingResult> {
    try {
      this.logger.log(`Iniciando processamento de imagem (${buffer.length} bytes)`);

      // Carregar imagem com Sharp
      let image = sharp(buffer);

      // Obter metadados originais
      const originalMetadata = await image.metadata();

      // Aplicar configurações padrão
      const processOptions = {
        maxWidth: options.maxWidth || this.DEFAULT_MAX_WIDTH,
        maxHeight: options.maxHeight || this.DEFAULT_MAX_HEIGHT,
        quality: options.quality || this.DEFAULT_QUALITY,
        format: options.format || this.getOptimalFormat(originalMetadata.format as string),
        createThumbnail: options.createThumbnail || false,
        thumbnailSize: options.thumbnailSize || this.DEFAULT_THUMBNAIL_SIZE,
        removeMetadata: options.removeMetadata !== false, // true por padrão
        optimize: options.optimize !== false, // true por padrão
      };

      // Redimensionar se necessário
      if (this.shouldResize(originalMetadata, processOptions)) {
        image = image.resize({
          width: processOptions.maxWidth,
          height: processOptions.maxHeight,
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      // Remover metadados EXIF se solicitado
      if (processOptions.removeMetadata) {
        image = image.rotate(); // Auto-rotaciona baseado no EXIF e remove metadados
      }

      // Aplicar formato e qualidade
      image = this.applyFormat(image, processOptions);

      // Processar imagem principal
      const processedBuffer = await image.toBuffer();

      // Obter metadados finais
      const finalMetadata = await sharp(processedBuffer).metadata();

      // Gerar thumbnail se solicitado
      let thumbnailBuffer: Buffer | undefined;
      if (processOptions.createThumbnail) {
        thumbnailBuffer = await this.createThumbnail(
          buffer,
          processOptions.thumbnailSize,
          processOptions.format
        );
      }

      // Gerar hash do arquivo processado
      const hash = this.generateHash(processedBuffer);

      const result: ProcessingResult = {
        originalBuffer: buffer,
        processedBuffer,
        thumbnailBuffer,
        metadata: {
          width: finalMetadata.width || 0,
          height: finalMetadata.height || 0,
          format: finalMetadata.format || 'unknown',
          size: processedBuffer.length,
          colorspace: finalMetadata.space || 'unknown',
          hasAlpha: finalMetadata.hasAlpha || false,
          density: finalMetadata.density,
        },
        hash,
      };

      const reduction = Math.round(((buffer.length - processedBuffer.length) / buffer.length) * 100);
      this.logger.log(`Processamento concluído: ${buffer.length} → ${processedBuffer.length} bytes (${reduction}% redução), ${result.metadata.width}x${result.metadata.height}`);

      return result;

    } catch (error) {
      this.logger.error('Erro no processamento de imagem:', error);
      throw new Error(`Erro no processamento de imagem: ${error.message}`);
    }
  }

  /**
   * Cria thumbnail da imagem
   */
  async createThumbnail(
    buffer: Buffer,
    size: number = this.DEFAULT_THUMBNAIL_SIZE,
    format: 'jpeg' | 'png' | 'webp' | 'avif' = 'jpeg'
  ): Promise<Buffer> {
    try {
      let thumbnail = sharp(buffer)
        .resize({
          width: size,
          height: size,
          fit: 'cover',
          position: 'centre',
        })
        .rotate(); // Remove EXIF

      // Aplicar formato
      switch (format) {
        case 'jpeg':
          thumbnail = thumbnail.jpeg({ quality: 75, progressive: true });
          break;
        case 'png':
          thumbnail = thumbnail.png({ compressionLevel: 8 });
          break;
        case 'webp':
          thumbnail = thumbnail.webp({ quality: 75 });
          break;
        case 'avif':
          thumbnail = thumbnail.avif({ quality: 75 });
          break;
      }

      return await thumbnail.toBuffer();

    } catch (error) {
      this.logger.error('Erro ao criar thumbnail:', error);
      throw new Error(`Erro ao criar thumbnail: ${error.message}`);
    }
  }

  /**
   * Otimiza imagem sem redimensionar
   */
  async optimizeImage(
    buffer: Buffer,
    quality: number = this.DEFAULT_QUALITY
  ): Promise<Buffer> {
    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();

      let optimized = image.rotate(); // Remove EXIF

      // Aplicar otimização baseada no formato
      switch (metadata.format) {
        case 'jpeg':
          optimized = optimized.jpeg({ 
            quality, 
            progressive: true,
            mozjpeg: true,
          });
          break;
        case 'png':
          optimized = optimized.png({ 
            compressionLevel: 8,
            palette: true,
          });
          break;
        case 'webp':
          optimized = optimized.webp({ quality });
          break;
        default:
          // Converter para JPEG se formato não suportado
          optimized = optimized.jpeg({ quality, progressive: true });
      }

      return await optimized.toBuffer();

    } catch (error) {
      this.logger.error('Erro na otimização:', error);
      throw error;
    }
  }

  /**
   * Converte imagem para formato específico
   */
  async convertFormat(
    buffer: Buffer,
    targetFormat: 'jpeg' | 'png' | 'webp' | 'avif',
    quality: number = this.DEFAULT_QUALITY
  ): Promise<Buffer> {
    try {
      let image = sharp(buffer).rotate(); // Remove EXIF

      image = this.applyFormat(image, { format: targetFormat, quality });

      return await image.toBuffer();

    } catch (error) {
      this.logger.error(`Erro na conversão para ${targetFormat}:`, error);
      throw error;
    }
  }

  /**
   * Extrai metadados da imagem
   */
  async extractMetadata(buffer: Buffer): Promise<sharp.Metadata> {
    try {
      return await sharp(buffer).metadata();
    } catch (error) {
      this.logger.error('Erro ao extrair metadados:', error);
      throw error;
    }
  }

  /**
   * Verifica se a imagem precisa ser redimensionada
   */
  private shouldResize(
    metadata: sharp.Metadata,
    options: { maxWidth: number; maxHeight: number }
  ): boolean {
    if (!metadata.width || !metadata.height) return false;
    
    return (
      metadata.width > options.maxWidth ||
      metadata.height > options.maxHeight
    );
  }

  /**
   * Aplica formato e qualidade à imagem
   */
  private applyFormat(
    image: sharp.Sharp,
    options: { format: string; quality: number }
  ): sharp.Sharp {
    switch (options.format) {
      case 'jpeg':
        return image.jpeg({ 
          quality: options.quality, 
          progressive: true,
          mozjpeg: true,
        });
      case 'png':
        return image.png({ 
          compressionLevel: 8,
          palette: true,
        });
      case 'webp':
        return image.webp({ quality: options.quality });
      case 'avif':
        return image.avif({ quality: options.quality });
      default:
        return image.jpeg({ quality: options.quality, progressive: true });
    }
  }

  /**
   * Determina o formato ideal baseado no formato original
   */
  private getOptimalFormat(originalFormat: string): 'jpeg' | 'png' | 'webp' | 'avif' {
    switch (originalFormat) {
      case 'png':
        return 'png'; // Manter PNG para preservar transparência
      case 'gif':
        return 'png'; // Converter GIF para PNG
      case 'webp':
        return 'webp';
      case 'avif':
        return 'avif';
      default:
        return 'jpeg'; // Padrão para outros formatos
    }
  }

  /**
   * Gera hash MD5 do buffer
   */
  private generateHash(buffer: Buffer): string {
    return crypto.createHash('md5').update(buffer).digest('hex');
  }

  /**
   * Calcula tamanho estimado baseado em dimensões
   */
  calculateEstimatedSize(
    width: number,
    height: number,
    format: string = 'jpeg',
    quality: number = this.DEFAULT_QUALITY
  ): number {
    const pixels = width * height;
    
    switch (format) {
      case 'jpeg':
        return Math.round(pixels * (quality / 100) * 0.5); // Estimativa JPEG
      case 'png':
        return Math.round(pixels * 3); // Estimativa PNG
      case 'webp':
        return Math.round(pixels * (quality / 100) * 0.3); // Estimativa WebP
      case 'avif':
        return Math.round(pixels * (quality / 100) * 0.2); // Estimativa AVIF
      default:
        return Math.round(pixels * 0.5);
    }
  }

  /**
   * Valida se o buffer é uma imagem válida
   */
  async validateImage(buffer: Buffer): Promise<boolean> {
    try {
      const metadata = await sharp(buffer).metadata();
      return !!(metadata.width && metadata.height && metadata.format);
    } catch {
      return false;
    }
  }

  /**
   * Obtém informações sobre formatos suportados
   */
  getSupportedFormats(): string[] {
    return [...this.SUPPORTED_FORMATS];
  }
}
