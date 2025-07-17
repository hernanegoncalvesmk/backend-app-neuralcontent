import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

/**
 * Entidade para controle de sessões de usuário
 *
 * @description Gerencia sessões ativas, refresh tokens e controle de segurança
 * Alinhada com migration usr_sessions para compatibilidade completa
 * @author NeuralContent Team
 * @since 1.0.0
 */
@Entity('usr_sessions')
@Index(['userId', 'isActive'])
@Index(['sessionToken'])
@Index(['refreshToken'])
@Index(['expiresAt'])
export class UserSession {
  @ApiProperty({
    description: 'ID único da sessão',
    example: 'uuid-v4-generated',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'ID do usuário proprietário da sessão',
    example: 1,
  })
  @Column('char', { length: 36, name: 'user_id' })
  userId: string;

  @ApiProperty({
    description: 'Token único da sessão',
    example: 'session-token-unique-hash',
  })
  @Column({ type: 'varchar', length: 255, unique: true, name: 'session_token' })
  sessionToken: string;

  @ApiProperty({
    description: 'Token de refresh único',
    example: 'refresh-token-unique-hash',
  })
  @Column({ type: 'varchar', length: 255, unique: true, name: 'refresh_token' })
  refreshToken: string;

  @ApiProperty({
    description: 'Data de expiração da sessão',
    example: '2025-07-20T12:00:00Z',
  })
  @Column('timestamp', { name: 'expires_at' })
  expiresAt: Date;

  @ApiProperty({
    description: 'Indica se a sessão está ativa',
    example: true,
    default: true,
  })
  @Column('boolean', { default: true, name: 'is_active' })
  isActive: boolean;

  @ApiProperty({
    description: 'Endereço IP da sessão',
    example: '192.168.1.100',
  })
  @Column('varchar', { length: 45, nullable: true, name: 'ip_address' })
  ipAddress?: string;

  @ApiProperty({
    description: 'User Agent do navegador/dispositivo',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  })
  @Column('text', { nullable: true, name: 'user_agent' })
  userAgent?: string;

  @ApiProperty({
    description: 'Data de criação da sessão',
    example: '2025-07-13T12:00:00Z',
  })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2025-07-13T15:30:00Z',
  })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relacionamentos
  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  /**
   * Verifica se a sessão está expirada
   */
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  /**
   * Marca a sessão como inativa
   */
  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  /**
   * Gera um novo session token único
   */
  static generateSessionToken(): string {
    return require('crypto').randomBytes(32).toString('hex');
  }

  /**
   * Gera um novo refresh token único
   */
  static generateRefreshToken(): string {
    return require('crypto').randomBytes(32).toString('hex');
  }

  /**
   * Calcula a data de expiração baseada na duração
   */
  static calculateExpirationDate(durationHours: number = 24): Date {
    const now = new Date();
    return new Date(now.getTime() + durationHours * 60 * 60 * 1000);
  }
}
