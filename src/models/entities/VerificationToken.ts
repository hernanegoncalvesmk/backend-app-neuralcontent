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

export enum TokenType {
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
  TWO_FACTOR = 'two_factor',
  ACCOUNT_ACTIVATION = 'account_activation'
}

@Entity('usr_verification_tokens')
@Index(['token'], { unique: true })
@Index(['userId'])
@Index(['type'])
@Index(['expiresAt'])
@Index(['isUsed'])
export class VerificationToken {
  @PrimaryGeneratedColumn('uuid', { name: 'token_id' })
  id!: string;

  @Column({ name: 'token', type: 'varchar', length: 255, unique: true })
  token!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ 
    name: 'type', 
    type: 'enum', 
    enum: TokenType 
  })
  type!: TokenType;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt!: Date;

  @Column({ name: 'is_used', type: 'boolean', default: false })
  isUsed!: boolean;

  @Column({ name: 'used_at', type: 'timestamp', nullable: true })
  usedAt?: Date;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', type: 'varchar', length: 1000, nullable: true })
  userAgent?: string;

  @Column({ 
    name: 'metadata', 
    type: 'json', 
    nullable: true,
    comment: 'Additional token metadata as JSON'
  })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relationships
  @ManyToOne(() => User, user => user.verificationTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  // Methods
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isValid(): boolean {
    return !this.isUsed && !this.isExpired();
  }

  markAsUsed(ipAddress?: string, userAgent?: string): void {
    this.isUsed = true;
    this.usedAt = new Date();
    if (ipAddress) {
      this.ipAddress = ipAddress;
    }
    if (userAgent) {
      this.userAgent = userAgent;
    }
  }

  static generateToken(): string {
    return Math.random().toString(36).substr(2, 15) + Math.random().toString(36).substr(2, 15);
  }

  static createEmailVerificationToken(userId: string, hoursValid: number = 24): VerificationToken {
    const token = new VerificationToken();
    token.token = this.generateToken();
    token.userId = userId;
    token.type = TokenType.EMAIL_VERIFICATION;
    token.expiresAt = new Date(Date.now() + hoursValid * 60 * 60 * 1000);
    return token;
  }

  static createPasswordResetToken(userId: string, hoursValid: number = 1): VerificationToken {
    const token = new VerificationToken();
    token.token = this.generateToken();
    token.userId = userId;
    token.type = TokenType.PASSWORD_RESET;
    token.expiresAt = new Date(Date.now() + hoursValid * 60 * 60 * 1000);
    return token;
  }
}
