import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { CreditBalance } from '../credits/entities/credit-balance.entity';
import { VerificationToken } from '../auth/entities/verification-token.entity';
import { AuthModule } from '../auth/auth.module';

/**
 * UsersModule - Módulo de gestão de usuários
 *
 * @description Fornece funcionalidades completas de CRUD e gestão de usuários
 * @author NeuralContent Team
 * @since 1.0.0
 *
 * @features
 * - CRUD completo de usuários
 * - Busca avançada com filtros
 * - Gestão de senhas
 * - Controle de status e roles
 * - Estatísticas e relatórios
 * - Auditoria completa
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User, CreditBalance, VerificationToken]),
    ConfigModule, // Para acessar configurações
    AuthModule, // Para AuthGuard e JWT
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
