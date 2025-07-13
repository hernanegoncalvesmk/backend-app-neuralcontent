import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm';
import { User } from './User';

export enum PermissionType {
  // User permissions
  USER_READ = 'user:read',
  USER_WRITE = 'user:write',
  USER_DELETE = 'user:delete',
  
  // Plan permissions
  PLAN_READ = 'plan:read',
  PLAN_WRITE = 'plan:write',
  PLAN_DELETE = 'plan:delete',
  
  // Payment permissions
  PAYMENT_READ = 'payment:read',
  PAYMENT_WRITE = 'payment:write',
  PAYMENT_PROCESS = 'payment:process',
  
  // Admin permissions
  ADMIN_PANEL_ACCESS = 'admin:panel:access',
  ADMIN_USERS_MANAGE = 'admin:users:manage',
  ADMIN_PAYMENTS_MANAGE = 'admin:payments:manage',
  ADMIN_PLANS_MANAGE = 'admin:plans:manage',
  ADMIN_ANALYTICS_VIEW = 'admin:analytics:view',
  ADMIN_SETTINGS_MANAGE = 'admin:settings:manage',
  
  // Credit permissions
  CREDIT_READ = 'credit:read',
  CREDIT_WRITE = 'credit:write',
  CREDIT_TRANSFER = 'credit:transfer',
  
  // Translation permissions
  TRANSLATION_READ = 'translation:read',
  TRANSLATION_WRITE = 'translation:write',
  TRANSLATION_MANAGE = 'translation:manage'
}

@Entity('usr_permissions')
@Index(['userId', 'permission'], { unique: true })
@Index(['permission'])
@Index(['isActive'])
export class UserPermission {
  @PrimaryGeneratedColumn('uuid', { name: 'permission_id' })
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ 
    name: 'permission', 
    type: 'enum', 
    enum: PermissionType 
  })
  permission!: PermissionType;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'granted_by', type: 'uuid', nullable: true })
  grantedBy?: string;

  @Column({ name: 'granted_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  grantedAt!: Date;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @Column({ name: 'revoked_at', type: 'timestamp', nullable: true })
  revokedAt?: Date;

  @Column({ name: 'revoked_by', type: 'uuid', nullable: true })
  revokedBy?: string;

  @Column({ name: 'reason', type: 'varchar', length: 500, nullable: true })
  reason?: string;

  @Column({ 
    name: 'metadata', 
    type: 'json', 
    nullable: true,
    comment: 'Additional permission metadata as JSON'
  })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relationships
  @ManyToOne(() => User, user => user.permissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  // Methods
  isExpired(): boolean {
    return this.expiresAt ? new Date() > this.expiresAt : false;
  }

  isValid(): boolean {
    return this.isActive && !this.isExpired() && !this.revokedAt;
  }

  revoke(revokedBy?: string, reason?: string): void {
    this.isActive = false;
    this.revokedAt = new Date();
    if (revokedBy) {
      this.revokedBy = revokedBy;
    }
    if (reason) {
      this.reason = reason;
    }
  }

  extend(hours: number): void {
    if (this.expiresAt) {
      this.expiresAt = new Date(this.expiresAt.getTime() + hours * 60 * 60 * 1000);
    } else {
      this.expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
    }
  }

  static getDefaultUserPermissions(): PermissionType[] {
    return [
      PermissionType.USER_READ,
      PermissionType.PLAN_READ,
      PermissionType.PAYMENT_READ,
      PermissionType.CREDIT_READ,
      PermissionType.TRANSLATION_READ
    ];
  }

  static getAdminPermissions(): PermissionType[] {
    return Object.values(PermissionType);
  }

  static getModeratorPermissions(): PermissionType[] {
    return [
      ...this.getDefaultUserPermissions(),
      PermissionType.USER_WRITE,
      PermissionType.PLAN_WRITE,
      PermissionType.TRANSLATION_WRITE,
      PermissionType.ADMIN_PANEL_ACCESS,
      PermissionType.ADMIN_USERS_MANAGE
    ];
  }
}
