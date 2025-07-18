import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  JoinColumn, 
  CreateDateColumn, 
  UpdateDateColumn,
  Index 
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

/**
 * Entidade para controle de sessões de usuário
 * 
 * @description Gerencia sessões ativas, refresh tokens e controle de segurança
 * @author NeuralContent Team
 * @since 1.0.0
 */
@Entity('user_sessions')
@Index(['userId', 'isActive'])
@Index(['refreshTokenHash'])
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
  @Column('int')
  userId: number;

  @ApiProperty({
    description: 'Hash do refresh token para segurança',
    example: 'bcrypt-hashed-refresh-token',
  })
  @Column({ type: 'varchar', length: 255 })
  refreshTokenHash: string;

  @ApiProperty({
    description: 'Data de expiração da sessão',
    example: '2025-07-20T12:00:00Z',
  })
  @Column('timestamp')
  expiresAt: Date;

  @ApiProperty({
    description: 'Indica se a sessão está ativa',
    example: true,
    default: true,
  })
  @Column('boolean', { default: true })
  isActive: boolean;

  @ApiProperty({
    description: 'Endereço IP da sessão',
    example: '192.168.1.100',
  })
  @Column('varchar', { length: 45, nullable: true })
  ipAddress?: string;

  @ApiProperty({
    description: 'User Agent do navegador/dispositivo',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  })
  @Column('text', { nullable: true })
  userAgent?: string;

  @ApiProperty({
    description: 'Localização geográfica aproximada',
    example: 'São Paulo, BR',
  })
  @Column('varchar', { length: 100, nullable: true })
  location?: string;

  @ApiProperty({
    description: 'Tipo de dispositivo utilizado',
    example: 'desktop',
  })
  @Column('varchar', { length: 50, nullable: true })
  deviceType?: string;

  @ApiProperty({
    description: 'Data da última atividade na sessão',
    example: '2025-07-13T15:30:00Z',
  })
  @Column('timestamp', { nullable: true })
  lastActivityAt?: Date;

  @ApiProperty({
    description: 'Contador de tentativas de renovação',
    example: 0,
    default: 0,
  })
  @Column('int', { default: 0 })
  refreshCount: number;

  @ApiProperty({
    description: 'Data de criação da sessão',
    example: '2025-07-13T12:00:00Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2025-07-13T15:30:00Z',
  })
  @UpdateDateColumn()
  updatedAt: Date;

  // Relacionamentos
  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
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
   * Atualiza a última atividade
   */
  updateActivity(): void {
    this.lastActivityAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Incrementa contador de refresh
   */
  incrementRefreshCount(): void {
    this.refreshCount++;
    this.updatedAt = new Date();
  }
}
