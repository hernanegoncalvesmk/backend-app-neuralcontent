import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from './user.entity';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
}

export enum PlanType {
  FREE = 'free',
  BASIC = 'basic',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
}

@Entity('PLN_user_subscriptions')
@Index(['user_id'], { unique: true })
@Index(['status'])
@Index(['plan_type'])
@Index(['expires_at'])
export class UserSubscriptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  user_id: string;

  @Column({
    type: 'enum',
    enum: PlanType,
    default: PlanType.FREE,
  })
  plan_type: PlanType;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  credits_available: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  credits_used: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  credits_bonus: number;

  @Column({ type: 'timestamp', nullable: true })
  trial_starts_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  trial_ends_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  starts_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  expires_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  canceled_at: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  cancellation_reason: string;

  @Column({ type: 'boolean', default: true })
  auto_renew: boolean;

  @Column({ type: 'json', nullable: true })
  features: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  limits: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  // Relationships
  @OneToOne(() => UserEntity, (user) => user.subscription, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
