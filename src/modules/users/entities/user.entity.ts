import { Entity, Column, Index, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../database/base.entity';
import { UserSession } from '../../auth/entities/user-session.entity';
import { CreditBalance } from '../../credits/entities/credit-balance.entity';

/**
 * Enums para User entity
 */
export enum UserRole {
  SUPER_ADMIN = 'super-admin',
  ADMIN = 'admin', 
  USER = 'user',
  GUEST = 'guest',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive', 
  PENDING = 'pending',
  SUSPENDED = 'suspended',
}

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
 * 
 * @table usr_users - Alinhado com migration 002
 */
@Entity('usr_users')
@Index(['email'], { unique: true })
@Index(['isActive'])
@Index(['role'])
@Index(['emailVerifiedAt'])
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
    name: 'first_name',
    comment: 'Primeiro nome do usuário',
  })
  firstName: string;

  @Column({
    type: 'varchar',
    length: 100,
    name: 'last_name', 
    comment: 'Sobrenome do usuário',
  })
  lastName: string;

  @Column({
    type: 'varchar',
    length: 255,
    select: false, // Nunca retorna a senha por padrão
    comment: 'Hash bcrypt da senha do usuário',
  })
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
    comment: 'Papel/função do usuário no sistema',
  })
  role: UserRole;

  @Column({
    type: 'boolean',
    default: true,
    name: 'is_active',
    comment: 'Indica se o usuário está ativo no sistema',
  })
  isActive: boolean;

  @Column({
    type: 'boolean',
    default: false,
    name: 'is_email_verified',
    comment: 'Indica se o email foi verificado pelo usuário',
  })
  isEmailVerified: boolean;

  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'email_verified_at',
    comment: 'Data e hora da verificação do email',
  })
  emailVerifiedAt?: Date;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    name: 'avatar_url',
    comment: 'URL do avatar/foto do usuário',
  })
  avatar?: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Telefone de contato do usuário',
  })
  phone?: string;

  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'last_login_at',
    comment: 'Data e hora do último login',
  })
  lastLoginAt?: Date;

  @Column({
    type: 'json',
    nullable: true,
    comment: 'Preferências do usuário em formato JSON',
  })
  preferences?: Record<string, any>;

  // Relacionamentos
  @OneToMany(() => UserSession, session => session.user, {
    cascade: true,
  })
  sessions: UserSession[];

  @OneToOne(() => CreditBalance, (creditBalance) => creditBalance.user, {
    cascade: true,
    eager: false,
  })
  creditBalance: CreditBalance;

  // Métodos de conveniência

  /**
   * Retorna o nome completo do usuário
   */
  getFullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  /**
   * Verifica se o usuário está ativo
   */
  getUserIsActive(): boolean {
    return this.isActive;
  }

  /**
   * Verifica se o usuário é administrador
   */
  isAdmin(): boolean {
    return this.role === UserRole.ADMIN || this.role === UserRole.SUPER_ADMIN;
  }

  /**
   * Verifica se o usuário tem permissões administrativas
   */
  hasAdminRights(): boolean {
    return this.isAdmin();
  }

  /**
   * Verifica se o usuário pode fazer login
   */
  canLogin(): boolean {
    return this.isActive && this.isEmailVerified;
  }

  /**
   * Atualiza dados do último login
   */
  updateLastLogin(): void {
    this.lastLoginAt = new Date();
  }

  /**
   * Gera URL do avatar usando Gravatar como fallback
   */
  getAvatarUrl(): string {
    if (this.avatar) {
      return this.avatar;
    }
    
    // Fallback para Gravatar
    const crypto = require('crypto');
    const hash = crypto.createHash('md5').update(this.email.toLowerCase()).digest('hex');
    return `https://www.gravatar.com/avatar/${hash}?d=identicon&s=200`;
  }

  /**
   * Verifica se o email foi verificado
   */
  isEmailVerifiedStatus(): boolean {
    return this.isEmailVerified && this.emailVerifiedAt !== null;
  }
}
