import { ApiProperty } from '@nestjs/swagger';
import { FileType, FileContext } from './upload-file.dto';

/**
 * Informações de um arquivo processado
 */
export class ProcessedFileInfo {
  @ApiProperty({
    description: 'Largura da imagem em pixels',
    example: 1920,
  })
  width?: number;

  @ApiProperty({
    description: 'Altura da imagem em pixels',
    example: 1080,
  })
  height?: number;

  @ApiProperty({
    description: 'Formato da imagem',
    example: 'jpeg',
  })
  format?: string;

  @ApiProperty({
    description: 'Espaço de cores',
    example: 'srgb',
  })
  colorspace?: string;

  @ApiProperty({
    description: 'Se tem canal alfa (transparência)',
    example: false,
  })
  hasAlpha?: boolean;

  @ApiProperty({
    description: 'Densidade da imagem (DPI)',
    example: 72,
  })
  density?: number;
}

/**
 * Resposta de upload de arquivo
 */
export class FileResponseDto {
  @ApiProperty({
    description: 'ID único do arquivo',
    example: 'uuid-v4',
  })
  id: string;

  @ApiProperty({
    description: 'Nome original do arquivo',
    example: 'document.pdf',
  })
  originalName: string;

  @ApiProperty({
    description: 'Nome do arquivo no storage',
    example: 'uploads/2025/01/uuid-document.pdf',
  })
  filename: string;

  @ApiProperty({
    description: 'Tipo MIME do arquivo',
    example: 'application/pdf',
  })
  mimeType: string;

  @ApiProperty({
    description: 'Tamanho do arquivo em bytes',
    example: 1024000,
  })
  size: number;

  @ApiProperty({
    description: 'Tipo do arquivo',
    enum: FileType,
    example: FileType.DOCUMENT,
  })
  fileType: FileType;

  @ApiProperty({
    description: 'Contexto de uso',
    enum: FileContext,
    example: FileContext.ATTACHMENT,
  })
  context: FileContext;

  @ApiProperty({
    description: 'URL de acesso ao arquivo',
    example: 'https://cdn.neuralcontent.com/uploads/2025/01/uuid-document.pdf',
  })
  url: string;

  @ApiProperty({
    description: 'URL do thumbnail (se aplicável)',
    example: 'https://cdn.neuralcontent.com/uploads/2025/01/uuid-document-thumb.jpg',
    required: false,
  })
  thumbnailUrl?: string;

  @ApiProperty({
    description: 'Descrição do arquivo',
    example: 'Documento importante',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Metadados adicionais do arquivo',
    required: false,
  })
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Data de upload',
    example: '2025-01-18T10:00:00Z',
  })
  uploadedAt: Date;
}

/**
 * Resposta de upload múltiplo
 */
export class MultipleFileResponseDto {
  @ApiProperty({
    description: 'Indica se todos os uploads foram bem-sucedidos',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Número de arquivos processados com sucesso',
    example: 3,
  })
  uploadedCount: number;

  @ApiProperty({
    description: 'Número total de arquivos enviados',
    example: 3,
  })
  totalCount: number;

  @ApiProperty({
    description: 'Arquivos processados com sucesso',
    type: [FileResponseDto],
  })
  files: FileResponseDto[];

  @ApiProperty({
    description: 'Erros que ocorreram durante o processamento',
    type: [String],
    required: false,
  })
  errors?: string[];
}

/**
 * Resposta de exclusão de arquivo
 */
export class DeleteFileResponseDto {
  @ApiProperty({
    description: 'Se a exclusão foi bem-sucedida',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Mensagem de resultado',
    example: 'Arquivo excluído com sucesso',
  })
  message: string;

  @ApiProperty({
    description: 'ID do arquivo excluído',
    example: 'uuid-v4',
  })
  fileId: string;
}

/**
 * Estatísticas de upload
 */
export class UploadStatsDto {
  @ApiProperty({
    description: 'Total de arquivos',
    example: 150,
  })
  totalFiles: number;

  @ApiProperty({
    description: 'Tamanho total em bytes',
    example: 1073741824,
  })
  totalSize: number;

  @ApiProperty({
    description: 'Estatísticas por tipo de arquivo',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        fileType: { type: 'string' },
        count: { type: 'number' },
        size: { type: 'number' },
      },
    },
  })
  typeBreakdown: Array<{
    fileType: string;
    count: number;
    size: number;
  }>;
}
