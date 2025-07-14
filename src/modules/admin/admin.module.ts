import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../users/entities/user.entity';
import { CreditTransaction } from '../credits/entities/credit-transaction.entity';

/**
 * Módulo Administrativo
 * 
 * @description Módulo responsável pelas funcionalidades administrativas do sistema
 * @author NeuralContent Team
 * @since 1.0.0
 * 
 * @features
 * - Estatísticas do sistema (usuários, receita, créditos)
 * - Gestão de usuários (CRUD, ações em lote)
 * - Dashboard administrativo
 * - Relatórios e métricas
 * - Logs do sistema
 * - Export de dados
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      CreditTransaction,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
