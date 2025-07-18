import { Entity, Column, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../database/base.entity';
import { UserSession } from '../../auth/entities/user-session.entity';
import { UserRole, UserStatus } from '../dto';

/**
 * Entidade User - Usuários do sistema NeuralContent
 * 
 * @description Representa um usuário no sistema com todas as funcionalidades
 * @author NeuralContent Team
 * @since 1.0.0
 * 
 * @features
 * - Autenticação e autorização
 * - Perfis de usuário
 * - Gestão de sessões
 * - Controle de acesso baseado em roles
 * - Auditoria completa
 */
@Entity('usr_users')
@Index(['status'])
@Index(['role'])
@Index(['isEmailVerified'])
@Index(['lastLoginAt'])
export class User extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
    comment: 'Email único do usuário para login',
  })
  email: string;

  @Column({
    type: 'varchar',
    length: 100,
    comment: 'Nome completo do usuário',
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 255,
    select: false, // Nunca retorna a senha por padrão
    comment: 'Hash bcrypt da senha do usuário',
  })
  password: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING,
    comment: 'Status atual do usuário no sistema',
  })
  status: UserStatus;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
    comment: 'Papel/função do usuário no sistema',
  })
  role: UserRole;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Indica se o email foi verificado pelo usuário',
  })
  isEmailVerified: boolean;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'URL do avatar/foto do usuário',
  })
  avatarUrl?: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Biografia ou descrição do usuário',
  })
  bio?: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Telefone de contato do usuário',
  })
  phone?: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Cidade do usuário',
  })
  city?: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'País do usuário',
  })
  country?: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Idioma preferido do usuário',
  })
  preferredLanguage?: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Timezone do usuário',
  })
  timezone?: string;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Data e hora do último login',
  })
  lastLoginAt?: Date;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'IP do último login',
  })
  lastLoginIp?: string;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Contador de tentativas de login falhadas',
  })
  failedLoginAttempts: number;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Data de bloqueio temporário por tentativas falhas',
  })
  lockedUntil?: Date;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Token para verificação de email',
  })
  emailVerificationToken?: string;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Data de expiração do token de verificação de email',
  })
  emailVerificationTokenExpiresAt?: Date;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Token para reset de senha',
  })
  passwordResetToken?: string;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Data de expiração do token de reset de senha',
  })
  passwordResetTokenExpiresAt?: Date;

  @Column({
    type: 'boolean',
    default: true,
    comment: 'Preferência para receber notificações por email',
  })
  emailNotifications: boolean;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Preferência para receber newsletters',
  })
  marketingEmails: boolean;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'URL da foto de perfil do usuário',
  })
  profilePicture?: string;

  @Column({
    type: 'json',
    nullable: true,
    comment: 'Metadados adicionais do usuário em formato JSON',
  })
  metadata?: Record<string, any>;

  // Relacionamentos
  @OneToMany(() => UserSession, session => session.user, {
    cascade: true,
  })
  sessions: UserSession[];

  // Métodos de conveniência

  /**
   * Verifica se o usuário está ativo
   */
  isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  /**
   * Verifica se o usuário é administrador
   */
  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  /**
   * Verifica se o usuário é moderador
   */
  isModerator(): boolean {
    return this.role === UserRole.MODERATOR;
  }

  /**
   * Verifica se o usuário tem permissões administrativas
   */
  hasAdminRights(): boolean {
    return this.isAdmin() || this.isModerator();
  }

  /**
   * Verifica se o usuário está bloqueado por tentativas de login
   */
  isLockedOut(): boolean {
    return Boolean(this.lockedUntil && this.lockedUntil > new Date());
  }

  /**
   * Verifica se o usuário pode fazer login
   */
  canLogin(): boolean {
    return this.isActive() && this.isEmailVerified && !this.isLockedOut();
  }

  /**
   * Atualiza dados do último login
   */
  updateLastLogin(ip?: string): void {
    this.lastLoginAt = new Date();
    if (ip) {
      this.lastLoginIp = ip;
    }
    this.failedLoginAttempts = 0;
    this.lockedUntil = undefined;
  }

  /**
   * Incrementa tentativas de login falhadas
   */
  incrementFailedAttempts(): void {
    this.failedLoginAttempts += 1;
    
    // Bloquear por 15 minutos após 5 tentativas
    if (this.failedLoginAttempts >= 5) {
      const lockDuration = 15 * 60 * 1000; // 15 minutos em ms
      this.lockedUntil = new Date(Date.now() + lockDuration);
    }
  }

  /**
   * Reseta tentativas de login falhadas
   */
  resetFailedAttempts(): void {
    this.failedLoginAttempts = 0;
    this.lockedUntil = undefined;
  }

  /**
   * Gera URL do avatar usando Gravatar como fallback
   */
  getAvatarUrl(): string {
    if (this.avatarUrl) {
      return this.avatarUrl;
    }
    
    // Fallback para Gravatar
    const crypto = require('crypto');
    const hash = crypto.createHash('md5').update(this.email.toLowerCase()).digest('hex');
    return `https://www.gravatar.com/avatar/${hash}?d=identicon&s=200`;
  }
}
