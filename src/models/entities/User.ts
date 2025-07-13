import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Index,
  BeforeInsert,
  BeforeUpdate
} from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UserSession } from './UserSession';
import { UserPermission } from './UserPermission';
import { VerificationToken } from './VerificationToken';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification'
}

@Entity('usr_users')
@Index(['email'], { unique: true })
@Index(['username'], { unique: true })
@Index(['status'])
@Index(['role'])
@Index(['createdAt'])
export class User {
  @PrimaryGeneratedColumn('uuid', { name: 'user_id' })
  id!: string;

  @Column({ name: 'username', type: 'varchar', length: 50, unique: true })
  username!: string;

  @Column({ name: 'email', type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ name: 'first_name', type: 'varchar', length: 100, nullable: true })
  firstName?: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100, nullable: true })
  lastName?: string;

  @Column({ 
    name: 'role', 
    type: 'enum', 
    enum: UserRole, 
    default: UserRole.USER 
  })
  role!: UserRole;

  @Column({ 
    name: 'status', 
    type: 'enum', 
    enum: UserStatus, 
    default: UserStatus.PENDING_VERIFICATION 
  })
  status!: UserStatus;

  @Column({ name: 'avatar_url', type: 'varchar', length: 500, nullable: true })
  avatarUrl?: string;

  @Column({ name: 'phone', type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth?: Date;

  @Column({ name: 'language', type: 'varchar', length: 10, default: 'en' })
  language!: string;

  @Column({ name: 'timezone', type: 'varchar', length: 50, default: 'UTC' })
  timezone!: string;

  @Column({ name: 'email_verified', type: 'boolean', default: false })
  emailVerified!: boolean;

  @Column({ name: 'phone_verified', type: 'boolean', default: false })
  phoneVerified!: boolean;

  @Column({ name: 'two_factor_enabled', type: 'boolean', default: false })
  twoFactorEnabled!: boolean;

  @Column({ name: 'two_factor_secret', type: 'varchar', length: 255, nullable: true })
  twoFactorSecret?: string;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt?: Date;

  @Column({ name: 'last_login_ip', type: 'varchar', length: 45, nullable: true })
  lastLoginIp?: string;

  @Column({ name: 'login_attempts', type: 'int', default: 0 })
  loginAttempts!: number;

  @Column({ name: 'locked_until', type: 'timestamp', nullable: true })
  lockedUntil?: Date;

  @Column({ name: 'password_reset_token', type: 'varchar', length: 255, nullable: true })
  passwordResetToken?: string;

  @Column({ name: 'password_reset_expires', type: 'timestamp', nullable: true })
  passwordResetExpires?: Date;

  @Column({ 
    name: 'metadata', 
    type: 'json', 
    nullable: true,
    comment: 'Additional user metadata as JSON'
  })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  // Relationships
  @OneToMany(() => UserSession, (session: UserSession) => session.user, { cascade: true })
  sessions!: UserSession[];

  @OneToMany(() => UserPermission, (permission: UserPermission) => permission.user, { cascade: true })
  permissions!: UserPermission[];

  @OneToMany(() => VerificationToken, (token: VerificationToken) => token.user, { cascade: true })
  verificationTokens!: VerificationToken[];

  // Virtual fields
  get fullName(): string {
    if (this.firstName && this.lastName) {
      return `${this.firstName} ${this.lastName}`;
    }
    return this.firstName || this.lastName || this.username;
  }

  get isLocked(): boolean {
    return this.lockedUntil ? new Date() < this.lockedUntil : false;
  }

  get isActive(): boolean {
    return this.status === UserStatus.ACTIVE && !this.isLocked;
  }

  // Hooks
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.passwordHash && !this.passwordHash.startsWith('$2')) {
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
      this.passwordHash = await bcrypt.hash(this.passwordHash, saltRounds);
    }
  }

  @BeforeInsert()
  setDefaults(): void {
    if (!this.language) {
      this.language = 'en';
    }
    if (!this.timezone) {
      this.timezone = 'UTC';
    }
  }

  // Methods
  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
  }

  async setPassword(password: string): Promise<void> {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
    this.passwordHash = await bcrypt.hash(password, saltRounds);
  }

  incrementLoginAttempts(): void {
    this.loginAttempts += 1;
    
    // Lock account after 5 failed attempts for 30 minutes
    if (this.loginAttempts >= 5) {
      this.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    }
  }

  resetLoginAttempts(): void {
    this.loginAttempts = 0;
    this.lockedUntil = undefined;
  }

  updateLastLogin(ip?: string): void {
    this.lastLoginAt = new Date();
    if (ip) {
      this.lastLoginIp = ip;
    }
    this.resetLoginAttempts();
  }

  generatePasswordResetToken(): string {
    const token = Math.random().toString(36).substr(2, 15) + Math.random().toString(36).substr(2, 15);
    this.passwordResetToken = token;
    this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    return token;
  }

  clearPasswordResetToken(): void {
    this.passwordResetToken = undefined;
    this.passwordResetExpires = undefined;
  }

  toJSON(): Partial<User> {
    const { passwordHash, twoFactorSecret, passwordResetToken, ...userWithoutSensitiveData } = this;
    return userWithoutSensitiveData;
  }
}
