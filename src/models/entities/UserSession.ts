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

@Entity('usr_sessions')
@Index(['sessionToken'], { unique: true })
@Index(['userId'])
@Index(['expiresAt'])
@Index(['isActive'])
export class UserSession {
  @PrimaryGeneratedColumn('uuid', { name: 'session_id' })
  id!: string;

  @Column({ name: 'session_token', type: 'varchar', length: 255, unique: true })
  sessionToken!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'refresh_token', type: 'varchar', length: 255, nullable: true })
  refreshToken?: string;

  @Column({ name: 'device_info', type: 'varchar', length: 500, nullable: true })
  deviceInfo?: string;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', type: 'varchar', length: 1000, nullable: true })
  userAgent?: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt!: Date;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'last_activity_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastActivityAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relationships
  @ManyToOne(() => User, user => user.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  // Methods
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isValid(): boolean {
    return this.isActive && !this.isExpired();
  }

  markAsInactive(): void {
    this.isActive = false;
  }

  updateActivity(): void {
    this.lastActivityAt = new Date();
  }

  extend(hours: number = 24): void {
    this.expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
    this.updateActivity();
  }
}
