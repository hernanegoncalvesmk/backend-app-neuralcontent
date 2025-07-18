import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { CreditsController } from './credits.controller';
import { CreditsService } from './credits.service';
import { CreditTransaction } from './entities/credit-transaction.entity';
import { User } from '../users/entities/user.entity';
import { LoggerModule } from '../../shared/logger/logger.module';

/**
 * Credits Module - Módulo de gerenciamento de créditos
 * 
 * @description Fornece funcionalidades completas para gerenciamento de créditos:
 * - Validação de saldo
 * - Consumo de créditos por serviços
 * - Adição de créditos (compras, bônus, etc.)
 * - Transferência entre usuários
 * - Histórico de transações
 * - Controle de expiração
 * 
 * @features
 * - Sistema transacional com rollback automático
 * - Auditoria completa de operações
 * - Suporte a diferentes tipos de serviços
 * - Cálculo de custos por tipo de operação
 * - Prevenção de concorrência com transações
 * - Logs detalhados para debugging
 * 
 * @author NeuralContent Team
 * @since 1.0.0
 */
@Module({
  imports: [
    // Importa as entidades necessárias para o módulo
    TypeOrmModule.forFeature([CreditTransaction, User]),
    
    // Importa o módulo JWT para autenticação
    JwtModule,
    
    // Importa o módulo de logger para rastreamento
    LoggerModule,
  ],
  controllers: [CreditsController],
  providers: [CreditsService],
  exports: [
    // Exporta o serviço para uso em outros módulos
    CreditsService,
    
    // Exporta o repository para acesso direto se necessário
    TypeOrmModule,
  ],
})
export class CreditsModule {}
