import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  ParseUUIDPipe,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../../shared/guards/auth.guard';
import { UploadService } from '../services/upload.service';
import { 
  UploadFileDto, 
  UploadMultipleDto, 
  UploadFromUrlDto 
} from '../dto/upload-file.dto';
import {
  FileResponseDto,
  MultipleFileResponseDto,
  DeleteFileResponseDto,
  UploadStatsDto,
} from '../dto/file-response.dto';

/**
 * Controlador de Upload
 * 
 * @description Endpoints para upload e gerenciamento de arquivos
 * @author NeuralContent Team
 * @since 1.0.0
 */
@ApiTags('upload')
@Controller('upload')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * Upload de arquivo único
   */
  @Post('file')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload de arquivo único',
    description: 'Faz upload de um arquivo único para o storage na nuvem',
  })
  @ApiResponse({
    status: 201,
    description: 'Arquivo enviado com sucesso',
    type: FileResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Arquivo inválido ou erro de validação',
  })
  @ApiResponse({
    status: 413,
    description: 'Arquivo muito grande',
  })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadFileDto,
    @Request() req: any,
  ): Promise<FileResponseDto> {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    const fileInfo = {
      originalname: file.originalname,
      mimetype: file.mimetype,
      buffer: file.buffer,
      size: file.size,
    };

    return this.uploadService.uploadFile(fileInfo, uploadDto, req.user);
  }

  /**
   * Upload de múltiplos arquivos
   */
  @Post('files')
  @UseInterceptors(FilesInterceptor('files', 10)) // Máximo 10 arquivos
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload de múltiplos arquivos',
    description: 'Faz upload de múltiplos arquivos simultaneamente',
  })
  @ApiResponse({
    status: 201,
    description: 'Arquivos processados',
    type: MultipleFileResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Erro de validação nos arquivos',
  })
  async uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() uploadDto: UploadMultipleDto,
    @Request() req: any,
  ): Promise<MultipleFileResponseDto> {
    if (!files || files.length === 0) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    const filesInfo = files.map(file => ({
      originalname: file.originalname,
      mimetype: file.mimetype,
      buffer: file.buffer,
      size: file.size,
    }));

    return this.uploadService.uploadMultipleFiles(filesInfo, uploadDto, req.user);
  }

  /**
   * Upload via URL externa
   */
  @Post('from-url')
  @ApiOperation({
    summary: 'Upload via URL',
    description: 'Faz download de uma URL externa e armazena como arquivo',
  })
  @ApiResponse({
    status: 201,
    description: 'Arquivo baixado e armazenado com sucesso',
    type: FileResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'URL inválida ou inacessível',
  })
  async uploadFromUrl(
    @Body() uploadDto: UploadFromUrlDto,
    @Request() req: any,
  ): Promise<FileResponseDto> {
    return this.uploadService.uploadFromUrl(uploadDto, req.user);
  }

  /**
   * Obter arquivo por ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Obter arquivo por ID',
    description: 'Recupera informações de um arquivo específico',
  })
  @ApiResponse({
    status: 200,
    description: 'Dados do arquivo',
    type: FileResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Arquivo não encontrado',
  })
  async getFile(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ): Promise<FileResponseDto> {
    const file = await this.uploadService.getFile(id, req.user);
    return this.uploadService['mapToFileResponse'](file);
  }

  /**
   * Listar arquivos do usuário
   */
  @Get()
  @ApiOperation({
    summary: 'Listar arquivos do usuário',
    description: 'Lista todos os arquivos do usuário com paginação e filtros',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de arquivos',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { $ref: '#/components/schemas/FileResponseDto' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
      },
    },
  })
  async listFiles(
    @Request() req: any,
    @Query('fileType') fileType?: string,
    @Query('context') context?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ): Promise<{
    files: FileResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.uploadService.getUserFiles(
      req.user,
      fileType,
      context,
      parseInt(page.toString()),
      parseInt(limit.toString()),
    );
  }

  /**
   * Deletar arquivo
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Deletar arquivo',
    description: 'Remove um arquivo do storage e do banco de dados',
  })
  @ApiResponse({
    status: 200,
    description: 'Arquivo deletado com sucesso',
    type: DeleteFileResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Arquivo não encontrado',
  })
  async deleteFile(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ): Promise<DeleteFileResponseDto> {
    return this.uploadService.deleteFile(id, req.user);
  }

  /**
   * Obter estatísticas de upload
   */
  @Get('stats/summary')
  @ApiOperation({
    summary: 'Estatísticas de upload',
    description: 'Obtém estatísticas de uso de arquivos do usuário',
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas de upload',
    type: UploadStatsDto,
  })
  async getStats(@Request() req: any): Promise<UploadStatsDto> {
    return this.uploadService.getUploadStats(req.user);
  }
}
