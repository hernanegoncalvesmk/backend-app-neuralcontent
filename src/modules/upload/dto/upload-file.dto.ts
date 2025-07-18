import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';

/**
 * Tipos de arquivo permitidos
 */
export enum FileType {
  IMAGE = 'image',
  DOCUMENT = 'document',
  VIDEO = 'video',
  AUDIO = 'audio',
  ARCHIVE = 'archive',
  OTHER = 'other',
}

/**
 * Contexto de uso do arquivo
 */
export enum FileContext {
  AVATAR = 'avatar',
  COVER = 'cover', 
  ATTACHMENT = 'attachment',
  DOCUMENT = 'document',
  MEDIA = 'media',
  TEMPLATE = 'template',
  EXPORT = 'export',
  TEMP = 'temp',
}

/**
 * DTO para upload de arquivo
 */
export class UploadFileDto {
  @ApiProperty({
    description: 'Tipo do arquivo',
    enum: FileType,
    example: FileType.IMAGE,
    required: false,
  })
  @IsOptional()
  @IsEnum(FileType)
  fileType?: FileType = FileType.OTHER;

  @ApiProperty({
    description: 'Contexto de uso do arquivo',
    enum: FileContext,
    example: FileContext.AVATAR,
    required: false,
  })
  @IsOptional()
  @IsEnum(FileContext)
  context?: FileContext = FileContext.ATTACHMENT;

  @ApiProperty({
    description: 'Descrição opcional do arquivo',
    example: 'Avatar do usuário',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Se deve processar imagem (redimensionar, otimizar)',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  processImage?: boolean = true;

  @ApiProperty({
    description: 'Largura máxima para redimensionamento (pixels)',
    example: 1920,
    required: false,
  })
  @IsOptional()
  maxWidth?: number;

  @ApiProperty({
    description: 'Altura máxima para redimensionamento (pixels)',
    example: 1080,
    required: false,
  })
  @IsOptional()
  maxHeight?: number;

  @ApiProperty({
    description: 'Qualidade da compressão (0-100)',
    example: 80,
    required: false,
  })
  @IsOptional()
  quality?: number;

  @ApiProperty({
    description: 'Se deve criar thumbnail',
    example: true,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  createThumbnail?: boolean = false;
}

/**
 * DTO para upload múltiplo
 */
export class UploadMultipleDto extends UploadFileDto {
  @ApiProperty({
    description: 'Número máximo de arquivos',
    example: 10,
    required: false,
    default: 5,
  })
  @IsOptional()
  maxFiles?: number = 5;
}

/**
 * DTO para upload com URL externa
 */
export class UploadFromUrlDto {
  @ApiProperty({
    description: 'URL do arquivo a ser baixado e armazenado',
    example: 'https://example.com/image.jpg',
  })
  @IsString()
  url: string;

  @ApiProperty({
    description: 'Nome personalizado para o arquivo',
    example: 'minha-imagem.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  filename?: string;

  @ApiProperty({
    description: 'Tipo do arquivo',
    enum: FileType,
    example: FileType.IMAGE,
    required: false,
  })
  @IsOptional()
  @IsEnum(FileType)
  fileType?: FileType = FileType.OTHER;

  @ApiProperty({
    description: 'Contexto de uso do arquivo',
    enum: FileContext,
    example: FileContext.MEDIA,
    required: false,
  })
  @IsOptional()
  @IsEnum(FileContext)
  context?: FileContext = FileContext.MEDIA;

  @ApiProperty({
    description: 'Se deve processar imagem',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  processImage?: boolean = true;

  @ApiProperty({
    description: 'Largura máxima para redimensionamento (pixels)',
    example: 1920,
    required: false,
  })
  @IsOptional()
  maxWidth?: number;

  @ApiProperty({
    description: 'Altura máxima para redimensionamento (pixels)',
    example: 1080,
    required: false,
  })
  @IsOptional()
  maxHeight?: number;

  @ApiProperty({
    description: 'Qualidade da compressão (0-100)',
    example: 80,
    required: false,
  })
  @IsOptional()
  quality?: number;

  @ApiProperty({
    description: 'Se deve criar thumbnail',
    example: true,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  createThumbnail?: boolean = false;
}
