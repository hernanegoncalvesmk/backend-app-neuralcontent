import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

/**
 * Enums para VerificationToken entity
 */
export enum VerificationTokenType {
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
  PHONE_VERIFICATION = 'phone_verification',
}

/**
 * Entidade VerificationToken - Tokens de verificação para diferentes processos
 * 
 * @description Gerencia tokens únicos para verificação de email, reset de senha e verificação de telefone
 * Alinhada com migration usr_verification_tokens (010) para compatibilidade completa
 * 
 * @author NeuralContent Team
 * @since 1.0.0
 * 
 * @features
 * - Tokens únicos com hash seguro
 * - Controle de expiração automática
 * - Suporte a múltiplos tipos de verificação
 * - Invalidação após uso (usedAt)
 * - Relacionamento Many-to-One com User
 * 
 * @security
 * - Tokens únicos (hash) para prevenir duplicação
 * - Expiração obrigatória para limitar janela de uso
 * - Cascade deletion quando usuário é removido
 * - Índices para performance em consultas frequentes
 * 
 * @types_supported
 * - email_verification: verificação de email após cadastro
 * - password_reset: reset de senha via email
 * - phone_verification: verificação de telefone via SMS
 */
@Entity('usr_verification_tokens')
@Index(['userId'])
@Index(['token'])
@Index(['type'])
@Index(['expiresAt'])
export class VerificationToken {
  @ApiProperty({
    description: 'ID único do token de verificação',
    example: 'uuid-v4-generated',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'ID do usuário proprietário do token',
    example: 'uuid-v4-user-id',
  })
  @Column('char', { length: 36, name: 'user_id' })
  userId: string;

  @ApiProperty({
    description: 'Token de verificação único (hash)',
    example: 'unique-hash-token-for-verification',
  })
  @Column({ type: 'varchar', length: 255, unique: true, name: 'token' })
  token: string;

  @ApiProperty({
    description: 'Tipo do token de verificação',
    enum: VerificationTokenType,
    example: VerificationTokenType.EMAIL_VERIFICATION,
  })
  @Column({
    type: 'enum',
    enum: VerificationTokenType,
    name: 'type',
  })
  type: VerificationTokenType;

  @ApiProperty({
    description: 'Data de expiração do token',
    example: '2025-07-18T10:30:00Z',
  })
  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt: Date;

  @ApiProperty({
    description: 'Data de uso do token (quando foi consumido)',
    example: '2025-07-17T15:45:00Z',
    required: false,
  })
  @Column({ type: 'timestamp', nullable: true, name: 'used_at' })
  usedAt: Date | null;

  @ApiProperty({
    description: 'Data de criação do token',
    example: '2025-07-17T10:00:00Z',
  })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // =====================
  // RELACIONAMENTOS
  // =====================

  @ApiProperty({
    description: 'Usuário proprietário do token',
    type: () => User,
  })
  @ManyToOne(() => User, (user) => user.verificationTokens, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // =====================
  // PROPRIEDADES COMPUTADAS
  // =====================

  @ApiProperty({
    description: 'Indica se o token está expirado',
    example: false,
  })
  get isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  @ApiProperty({
    description: 'Indica se o token foi usado',
    example: false,
  })
  get isUsed(): boolean {
    return this.usedAt !== null;
  }

  @ApiProperty({
    description: 'Indica se o token está válido (não expirado e não usado)',
    example: true,
  })
  get isValid(): boolean {
    return !this.isExpired && !this.isUsed;
  }

  @ApiProperty({
    description: 'Tempo restante em minutos até a expiração',
    example: 120,
  })
  get timeToExpiry(): number {
    if (this.isExpired) return 0;
    return Math.max(0, Math.floor((this.expiresAt.getTime() - Date.now()) / (1000 * 60)));
  }

  // =====================
  // MÉTODOS UTILITÁRIOS
  // =====================

  /**
   * Marca o token como usado
   * @description Define usedAt com timestamp atual, invalidando o token
   */
  markAsUsed(): void {
    this.usedAt = new Date();
  }

  /**
   * Verifica se o token é válido para uso
   * @description Combina verificações de expiração e uso
   * @returns {boolean} true se válido, false caso contrário
   */
  canBeUsed(): boolean {
    return this.isValid;
  }

  /**
   * Verifica se o token é do tipo especificado
   * @param type Tipo a ser verificado
   * @returns {boolean} true se for do tipo especificado
   */
  isOfType(type: VerificationTokenType): boolean {
    return this.type === type;
  }

  /**
   * Cria uma nova data de expiração baseada em minutos
   * @param minutes Número de minutos para expiração
   * @returns {Date} Nova data de expiração
   */
  static createExpiryDate(minutes: number): Date {
    const now = new Date();
    return new Date(now.getTime() + minutes * 60 * 1000);
  }

  /**
   * Tempos padrão de expiração por tipo de token
   */
  static readonly DEFAULT_EXPIRY_MINUTES = {
    [VerificationTokenType.EMAIL_VERIFICATION]: 24 * 60, // 24 horas
    [VerificationTokenType.PASSWORD_RESET]: 30, // 30 minutos
    [VerificationTokenType.PHONE_VERIFICATION]: 10, // 10 minutos
  };

  /**
   * Cria data de expiração baseada no tipo do token
   * @param type Tipo do token
   * @returns {Date} Data de expiração apropriada
   */
  static createExpiryForType(type: VerificationTokenType): Date {
    const minutes = this.DEFAULT_EXPIRY_MINUTES[type];
    return this.createExpiryDate(minutes);
  }

  // =====================
  // MÉTODOS DE VALIDAÇÃO
  // =====================

  /**
   * Valida se o token pode ser usado para o tipo específico
   * @param type Tipo de verificação esperado
   * @returns {boolean} true se válido para o tipo
   */
  isValidForType(type: VerificationTokenType): boolean {
    return this.canBeUsed() && this.isOfType(type);
  }

  /**
   * Formata o token para exibição segura (mascarado)
   * @returns {string} Token mascarado para logs
   */
  toSafeString(): string {
    if (!this.token || this.token.length < 8) return '***';
    return `${this.token.substring(0, 4)}***${this.token.substring(this.token.length - 4)}`;
  }

  // =====================
  // MÉTODOS DE AUDITORIA
  // =====================

  /**
   * Cria um resumo do token para logs de auditoria
   * @returns {object} Objeto com informações seguras do token
   */
  toAuditLog(): {
    id: string;
    userId: string;
    type: VerificationTokenType;
    tokenMask: string;
    isExpired: boolean;
    isUsed: boolean;
    expiresAt: Date;
    usedAt: Date | null;
  } {
    return {
      id: this.id,
      userId: this.userId,
      type: this.type,
      tokenMask: this.toSafeString(),
      isExpired: this.isExpired,
      isUsed: this.isUsed,
      expiresAt: this.expiresAt,
      usedAt: this.usedAt,
    };
  }
}
