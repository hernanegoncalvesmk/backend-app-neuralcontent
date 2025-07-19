import { Entity, Column, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../database/base.entity';
import { UserSession } from '../../auth/entities/user-session.entity';

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
@Index(['email'])
@Index(['status'])
@Index(['role'])
@Index(['email_verified'])
@Index(['last_login_at'])
@Index(['status', 'deletedAt'])
@Index(['role', 'status'])
export class User extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 255,
    comment: 'Nome completo do usuário',
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
    comment: 'Email único do usuário',
  })
  email: string;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Indicador se o email foi verificado',
  })
  email_verified: boolean;

  @Column({
    type: 'datetime',
    precision: 6,
    nullable: true,
    comment: 'Data e hora de verificação do email',
  })
  email_verified_at?: Date;

  @Column({
    type: 'varchar',
    length: 255,
    select: false, // Nunca retorna a senha por padrão
    comment: 'Hash da senha do usuário (bcrypt)',
  })
  password_hash: string;

  @Column({
    type: 'enum',
    enum: ['admin', 'user', 'moderator'],
    default: 'user',
    comment: 'Papel do usuário no sistema',
  })
  role: 'admin' | 'user' | 'moderator';

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'pending', 'suspended'],
    default: 'pending',
    comment: 'Status atual do usuário',
  })
  status: 'active' | 'inactive' | 'pending' | 'suspended';

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'URL do avatar do usuário',
  })
  avatar_url?: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Número de telefone do usuário',
  })
  phone?: string;

  @Column({
    type: 'varchar',
    length: 10,
    default: 'pt-BR',
    comment: 'Idioma preferido do usuário',
  })
  language: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'America/Sao_Paulo',
    comment: 'Timezone do usuário',
  })
  timezone: string;

  @Column({
    type: 'datetime',
    precision: 6,
    nullable: true,
    comment: 'Data e hora do último login',
  })
  last_login_at?: Date;

  @Column({
    type: 'varchar',
    length: 45,
    nullable: true,
    comment: 'IP do último login',
  })
  last_login_ip?: string;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Contador de tentativas de login',
  })
  login_attempts: number;

  @Column({
    type: 'datetime',
    precision: 6,
    nullable: true,
    comment: 'Data até quando a conta está bloqueada',
  })
  locked_until?: Date;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Token para reset de senha',
  })
  password_reset_token?: string;

  @Column({
    type: 'datetime',
    precision: 6,
    nullable: true,
    comment: 'Data de expiração do token de reset',
  })
  password_reset_expires?: Date;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Token para verificação de email',
  })
  email_verification_token?: string;

  @Column({
    type: 'datetime',
    precision: 6,
    nullable: true,
    comment: 'Data de expiração do token de verificação',
  })
  email_verification_expires?: Date;

  @Column({
    type: 'json',
    nullable: true,
    comment: 'Preferências do usuário em formato JSON',
  })
  preferences?: Record<string, any>;

  @Column({
    type: 'json',
    nullable: true,
    comment: 'Metadados adicionais do usuário',
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
    return this.status === 'active';
  }

  /**
   * Verifica se o usuário é administrador
   */
  isAdmin(): boolean {
    return this.role === 'admin';
  }

  /**
   * Verifica se o usuário é moderador
   */
  isModerator(): boolean {
    return this.role === 'moderator';
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
    return Boolean(this.locked_until && this.locked_until > new Date());
  }

  /**
   * Verifica se o usuário pode fazer login
   */
  canLogin(): boolean {
    return this.isActive() && this.email_verified && !this.isLockedOut();
  }

  /**
   * Atualiza dados do último login
   */
  updateLastLogin(ip?: string): void {
    this.last_login_at = new Date();
    if (ip) {
      this.last_login_ip = ip;
    }
    this.login_attempts = 0;
    this.locked_until = undefined;
  }

  /**
   * Incrementa tentativas de login falhadas
   */
  incrementFailedAttempts(): void {
    this.login_attempts += 1;
    
    // Bloquear por 15 minutos após 5 tentativas
    if (this.login_attempts >= 5) {
      const lockDuration = 15 * 60 * 1000; // 15 minutos em ms
      this.locked_until = new Date(Date.now() + lockDuration);
    }
  }

  /**
   * Reseta tentativas de login falhadas
   */
  resetFailedAttempts(): void {
    this.login_attempts = 0;
    this.locked_until = undefined;
  }

  /**
   * Gera URL do avatar usando Gravatar como fallback
   */
  getAvatarUrl(): string {
    if (this.avatar_url) {
      return this.avatar_url;
    }
    
    // Fallback para Gravatar
    const crypto = require('crypto');
    const hash = crypto.createHash('md5').update(this.email.toLowerCase()).digest('hex');
    return `https://www.gravatar.com/avatar/${hash}?d=identicon&s=200`;
  }
}
