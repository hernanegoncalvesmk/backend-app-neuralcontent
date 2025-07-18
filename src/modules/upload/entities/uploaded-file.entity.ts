import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  VersionColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { FileType, FileContext } from '../dto';

/**
 * Entidade de Arquivo Uploadado
 * 
 * @description Representa um arquivo armazenado no sistema
 * @author NeuralContent Team
 * @since 1.0.0
 */
@Entity('upl_uploaded_files')
@Index(['uploadedBy', 'isActive'])
@Index(['type', 'context'])
@Index(['hash'])
@Index(['expiresAt'])
export class UploadedFile {
  @ApiProperty({
    description: 'Identificador único auto-incrementável',
  })
  @PrimaryGeneratedColumn('uuid', {
    comment: 'Identificador único UUID do arquivo',
  })
  id: string;

  @ApiProperty({
    description: 'Data e hora de criação do registro',
  })
  @CreateDateColumn({
    type: 'datetime',
    precision: 6,
    default: () => 'CURRENT_TIMESTAMP(6)',
    comment: 'Data e hora de criação do registro',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data e hora da última atualização do registro',
  })
  @UpdateDateColumn({
    type: 'datetime',
    precision: 6,
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
    comment: 'Data e hora da última atualização do registro',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Data e hora de soft delete do registro',
    required: false,
  })
  @DeleteDateColumn({
    type: 'datetime',
    precision: 6,
    nullable: true,
    comment: 'Data e hora de soft delete do registro',
  })
  deletedAt?: Date;

  @ApiProperty({
    description: 'Versão do registro para controle de concorrência otimista',
  })
  @VersionColumn({
    comment: 'Versão do registro para controle de concorrência otimista',
  })
  version: number;

  @ApiProperty({
    description: 'Nome original do arquivo',
  })
  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Nome original do arquivo enviado',
  })
  originalName: string;

  @ApiProperty({
    description: 'Nome do arquivo no storage',
  })
  @Column({
    type: 'varchar',
    length: 500,
    nullable: false,
    unique: true,
    comment: 'Caminho/nome do arquivo no sistema de storage',
  })
  filename: string;

  @ApiProperty({
    description: 'Tipo MIME do arquivo',
  })
  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: 'Tipo MIME do arquivo',
  })
  mimeType: string;

  @ApiProperty({
    description: 'Tamanho do arquivo em bytes',
  })
  @Column({
    type: 'bigint',
    unsigned: true,
    nullable: false,
    comment: 'Tamanho do arquivo em bytes',
  })
  size: number;

  @ApiProperty({
    description: 'Tipo do arquivo',
    enum: FileType,
  })
  @Column({
    type: 'enum',
    enum: FileType,
    default: FileType.OTHER,
    comment: 'Categoria do tipo de arquivo',
  })
  type: FileType;

  @ApiProperty({
    description: 'Contexto de uso do arquivo',
    enum: FileContext,
  })
  @Column({
    type: 'enum',
    enum: FileContext,
    default: FileContext.ATTACHMENT,
    comment: 'Contexto de uso do arquivo no sistema',
  })
  context: FileContext;

  @ApiProperty({
    description: 'URL de acesso ao arquivo',
  })
  @Column({
    type: 'varchar',
    length: 1000,
    nullable: false,
    comment: 'URL de acesso público ao arquivo',
  })
  url: string;

  @ApiProperty({
    description: 'URL do thumbnail',
    required: false,
  })
  @Column({
    type: 'varchar',
    length: 1000,
    nullable: true,
    comment: 'URL do thumbnail do arquivo (se aplicável)',
  })
  thumbnailUrl?: string;

  @ApiProperty({
    description: 'Descrição do arquivo',
    required: false,
  })
  @Column({
    type: 'text',
    nullable: true,
    comment: 'Descrição opcional do arquivo',
  })
  description?: string;

  @ApiProperty({
    description: 'Hash MD5 do arquivo para verificação de integridade',
  })
  @Column({
    type: 'varchar',
    length: 32,
    nullable: false,
    comment: 'Hash MD5 do arquivo para verificação de integridade',
  })
  hash: string;

  @ApiProperty({
    description: 'Metadados adicionais do arquivo',
    required: false,
  })
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Metadados adicionais do arquivo (dimensões, formato, etc.)',
  })
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Se o arquivo está ativo',
  })
  @Column({
    type: 'boolean',
    default: true,
    comment: 'Indica se o arquivo está ativo no sistema',
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Data de expiração do arquivo',
    required: false,
  })
  @Column({
    type: 'datetime',
    nullable: true,
    comment: 'Data de expiração automática do arquivo',
  })
  expiresAt?: Date;

  @ApiProperty({
    description: 'ID do usuário que fez upload',
  })
  @Column({
    type: 'int',
    nullable: false,
    comment: 'ID do usuário que fez upload do arquivo',
  })
  uploadedBy: number;

  @ApiProperty({
    description: 'Dados do usuário que fez upload',
    type: () => User,
  })
  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'uploadedBy' })
  user?: User;

  @ApiProperty({
    description: 'Número de downloads/acessos',
  })
  @Column({
    type: 'int',
    unsigned: true,
    default: 0,
    comment: 'Contador de downloads/acessos ao arquivo',
  })
  downloadCount: number;

  @ApiProperty({
    description: 'Data do último acesso',
    required: false,
  })
  @Column({
    type: 'datetime',
    nullable: true,
    comment: 'Data e hora do último acesso ao arquivo',
  })
  lastAccessedAt?: Date;

  @ApiProperty({
    description: 'Identificador no storage externo (Backblaze)',
    required: false,
  })
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'ID do arquivo no storage externo (Backblaze B2)',
  })
  externalId?: string;

  /**
   * Verifica se o arquivo está expirado
   */
  isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }

  /**
   * Incrementa contador de downloads
   */
  incrementDownload(): void {
    this.downloadCount += 1;
    this.lastAccessedAt = new Date();
  }

  /**
   * Marca arquivo como inativo
   */
  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  /**
   * Ativa arquivo
   */
  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  /**
   * Atualiza URL de acesso
   */
  updateUrl(newUrl: string, thumbnailUrl?: string): void {
    this.url = newUrl;
    if (thumbnailUrl) {
      this.thumbnailUrl = thumbnailUrl;
    }
    this.updatedAt = new Date();
  }

  /**
   * Converte para DTO de resposta
   */
  toResponseDto(): any {
    return {
      id: this.id,
      originalName: this.originalName,
      filename: this.filename,
      mimeType: this.mimeType,
      size: this.size,
      type: this.type,
      context: this.context,
      url: this.url,
      thumbnailUrl: this.thumbnailUrl,
      description: this.description,
      hash: this.hash,
      uploadedAt: this.createdAt,
      uploadedBy: this.uploadedBy,
      isActive: this.isActive,
      expiresAt: this.expiresAt,
      downloadCount: this.downloadCount,
      lastAccessedAt: this.lastAccessedAt,
      processedInfo: this.metadata?.processedInfo,
    };
  }
}
