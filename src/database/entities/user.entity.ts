import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../base.entity';

/**
 * User Entity - Entidade de exemplo para testar a conexão com o banco
 * 
 * Esta entidade será expandida posteriormente no módulo de usuários
 */
@Entity('users')
@Index(['status'])
export class User extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
    comment: 'Email único do usuário',
  })
  email: string;

  @Column({
    type: 'varchar',
    length: 255,
    comment: 'Nome completo do usuário',
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 255,
    select: false, // Não retorna a senha por padrão
    comment: 'Hash da senha do usuário',
  })
  password: string;

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'pending', 'suspended'],
    default: 'pending',
    comment: 'Status do usuário no sistema',
  })
  status: 'active' | 'inactive' | 'pending' | 'suspended';

  @Column({
    type: 'enum',
    enum: ['user', 'admin', 'moderator'],
    default: 'user',
    comment: 'Papel do usuário no sistema',
  })
  role: 'user' | 'admin' | 'moderator';

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Data/hora da última verificação de email',
  })
  emailVerifiedAt?: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Data/hora do último login',
  })
  lastLoginAt?: Date;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Telefone do usuário',
  })
  phone?: string;

  @Column({
    type: 'date',
    nullable: true,
    comment: 'Data de nascimento do usuário',
  })
  birthDate?: Date;

  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    comment: 'Idioma preferido do usuário',
  })
  language?: string;

  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    comment: 'Timezone do usuário',
  })
  timezone?: string;

  @Column({
    type: 'json',
    nullable: true,
    comment: 'Preferências adicionais do usuário em formato JSON',
  })
  preferences?: Record<string, any>;
}
