import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../../shared/logger/logger.service';

// Importação do Backblaze B2
const B2 = require('backblaze-b2');

/**
 * Interface para configuração do Backblaze
 */
interface BackblazeConfig {
  accountId: string;
  applicationKey: string;
  bucketId: string;
  bucketName: string;
}

/**
 * Interface para upload de arquivo
 */
interface UploadOptions {
  fileName: string;
  data: Buffer;
  contentType: string;
  info?: Record<string, string>;
}

/**
 * Interface para resposta de upload
 */
interface UploadResponse {
  fileId: string;
  fileName: string;
  url: string;
  contentLength: number;
  contentSha1: string;
  contentType: string;
  uploadTimestamp: number;
}

/**
 * Serviço Backblaze B2
 * 
 * @description Gerencia uploads e downloads no Backblaze B2
 * @author NeuralContent Team
 * @since 1.0.0
 */
@Injectable()
export class BackblazeService {
  private b2: any;
  private config: BackblazeConfig;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('BackblazeService');
    this.loadConfig();
  }

  /**
   * Carrega configuração do Backblaze
   */
  private loadConfig(): void {
    this.config = {
      accountId: this.configService.get<string>('BACKBLAZE_ACCOUNT_ID') || '',
      applicationKey: this.configService.get<string>('BACKBLAZE_APPLICATION_KEY') || '',
      bucketId: this.configService.get<string>('BACKBLAZE_BUCKET_ID') || '',
      bucketName: this.configService.get<string>('BACKBLAZE_BUCKET_NAME') || '',
    };

    // Validar configuração
    if (!this.config.accountId || !this.config.applicationKey) {
      this.logger.warn('Backblaze não configurado - arquivos serão armazenados localmente');
      return;
    }

    this.logger.log('Configuração Backblaze carregada');
  }

  /**
   * Inicializa conexão com Backblaze
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._doInitialize();
    return this.initPromise;
  }

  private async _doInitialize(): Promise<void> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Backblaze não configurado');
      }

      this.b2 = new B2({
        accountId: this.config.accountId,
        applicationKey: this.config.applicationKey,
      });

      // Autorizar conta
      await this.b2.authorize();
      
      this.isInitialized = true;
      this.logger.log('Backblaze B2 inicializado com sucesso');

    } catch (error) {
      this.logger.error('Erro ao inicializar Backblaze:', error);
      throw new InternalServerErrorException('Erro na inicialização do storage');
    }
  }

  /**
   * Verifica se o Backblaze está configurado
   */
  private isConfigured(): boolean {
    return !!(
      this.config.accountId &&
      this.config.applicationKey &&
      this.config.bucketId &&
      this.config.bucketName
    );
  }

  /**
   * Verifica se o serviço está disponível
   */
  async isAvailable(): Promise<boolean> {
    try {
      if (!this.isConfigured()) return false;
      
      await this.initialize();
      return this.isInitialized;
    } catch (error) {
      this.logger.error('Backblaze não disponível:', error);
      return false;
    }
  }

  /**
   * Faz upload de arquivo
   */
  async uploadFile(options: UploadOptions): Promise<UploadResponse> {
    try {
      await this.initialize();

      this.logger.log(`Iniciando upload: ${options.fileName} (${options.contentType}, ${options.data.length} bytes)`);

      // Obter URL de upload
      const uploadUrlResponse = await this.b2.getUploadUrl({
        bucketId: this.config.bucketId,
      });

      // Fazer upload
      const uploadResponse = await this.b2.uploadFile({
        uploadUrl: uploadUrlResponse.data.uploadUrl,
        uploadAuthToken: uploadUrlResponse.data.authorizationToken,
        fileName: options.fileName,
        data: options.data,
        info: options.info || {},
        mime: options.contentType,
      });

      const fileData = uploadResponse.data;

      // Gerar URL pública
      const publicUrl = this.generatePublicUrl(options.fileName);

      const result: UploadResponse = {
        fileId: fileData.fileId,
        fileName: fileData.fileName,
        url: publicUrl,
        contentLength: fileData.contentLength,
        contentSha1: fileData.contentSha1,
        contentType: fileData.contentType,
        uploadTimestamp: fileData.uploadTimestamp,
      };

      this.logger.log(`Upload concluído: ${options.fileName} (ID: ${result.fileId})`);

      return result;

    } catch (error) {
      this.logger.error(`Erro no upload: ${options.fileName}`, error);
      throw new InternalServerErrorException('Erro no upload do arquivo');
    }
  }

  /**
   * Exclui arquivo
   */
  async deleteFile(fileName: string, fileId?: string): Promise<boolean> {
    try {
      await this.initialize();

      let targetFileId = fileId;

      // Se não temos fileId, buscar pelo nome
      if (!targetFileId) {
        const fileInfo = await this.getFileInfo(fileName);
        if (!fileInfo) {
          this.logger.warn(`Arquivo não encontrado para exclusão: ${fileName}`);
          return false;
        }
        targetFileId = fileInfo.fileId;
      }

      await this.b2.deleteFileVersion({
        fileId: targetFileId,
        fileName: fileName,
      });

      this.logger.log(`Arquivo excluído: ${fileName} (ID: ${targetFileId})`);
      return true;

    } catch (error) {
      this.logger.error(`Erro ao excluir arquivo: ${fileName}`, error);
      return false;
    }
  }

  /**
   * Obtém informações de um arquivo
   */
  async getFileInfo(fileName: string): Promise<any> {
    try {
      await this.initialize();

      const response = await this.b2.listFileNames({
        bucketId: this.config.bucketId,
        startFileName: fileName,
        maxFileCount: 1,
      });

      const files = response.data.files;
      const file = files.find((f: any) => f.fileName === fileName);

      return file || null;

    } catch (error) {
      this.logger.error(`Erro ao obter info do arquivo: ${fileName}`, error);
      return null;
    }
  }

  /**
   * Gera URL pública de acesso ao arquivo
   */
  private generatePublicUrl(fileName: string): string {
    // URL pública do Backblaze B2
    return `https://f${this.config.bucketId.slice(0, 3)}.backblazeb2.com/file/${this.config.bucketName}/${fileName}`;
  }

  /**
   * Gera URL de download direto (com autorização)
   */
  async getDownloadUrl(fileName: string): Promise<string> {
    try {
      await this.initialize();

      const response = await this.b2.getDownloadAuthorization({
        bucketId: this.config.bucketId,
        fileNamePrefix: fileName,
        validDurationInSeconds: 3600, // 1 hora
      });

      const authToken = response.data.authorizationToken;
      const baseUrl = this.generatePublicUrl(fileName);
      
      return `${baseUrl}?Authorization=${authToken}`;

    } catch (error) {
      this.logger.error(`Erro ao gerar URL de download: ${fileName}`, error);
      // Fallback para URL pública
      return this.generatePublicUrl(fileName);
    }
  }

  /**
   * Lista arquivos do bucket
   */
  async listFiles(prefix?: string, maxCount = 100): Promise<any[]> {
    try {
      await this.initialize();

      const response = await this.b2.listFileNames({
        bucketId: this.config.bucketId,
        startFileName: prefix,
        maxFileCount: maxCount,
      });

      return response.data.files || [];

    } catch (error) {
      this.logger.error('Erro ao listar arquivos:', error);
      return [];
    }
  }

  /**
   * Obtém estatísticas do bucket
   */
  async getBucketStats(): Promise<{
    fileCount: number;
    totalSize: number;
  }> {
    try {
      await this.initialize();

      // Listar todos os arquivos (limitado para performance)
      const files = await this.listFiles(undefined, 10000);
      
      const stats = files.reduce(
        (acc, file) => ({
          fileCount: acc.fileCount + 1,
          totalSize: acc.totalSize + (file.size || 0),
        }),
        { fileCount: 0, totalSize: 0 }
      );

      return stats;

    } catch (error) {
      this.logger.error('Erro ao obter estatísticas:', error);
      return { fileCount: 0, totalSize: 0 };
    }
  }

  /**
   * Verifica se um arquivo existe
   */
  async fileExists(fileName: string): Promise<boolean> {
    try {
      const fileInfo = await this.getFileInfo(fileName);
      return !!fileInfo;
    } catch (error) {
      return false;
    }
  }

  /**
   * Copia arquivo
   */
  async copyFile(
    sourceFileName: string,
    destinationFileName: string
  ): Promise<boolean> {
    try {
      await this.initialize();

      // Backblaze B2 não tem operação de cópia direta
      // Seria necessário baixar e fazer upload novamente
      // Por ora, retornamos false para indicar não suportado
      
      this.logger.warn('Operação de cópia não implementada para Backblaze B2');
      return false;

    } catch (error) {
      this.logger.error('Erro na cópia de arquivo:', error);
      return false;
    }
  }

  /**
   * Obtém configuração atual
   */
  getConfig(): Partial<BackblazeConfig> {
    return {
      accountId: this.config.accountId,
      bucketName: this.config.bucketName,
      bucketId: this.config.bucketId,
      // Não expor applicationKey por segurança
    };
  }
}
