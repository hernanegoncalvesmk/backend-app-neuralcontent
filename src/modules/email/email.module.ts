import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';

/**
 * Módulo de Email
 * 
 * Responsável por:
 * - Configuração SMTP
 * - Envio de emails simples e templates
 * - Renderização de templates Handlebars
 * - Cache de templates
 * - Validação de emails
 * 
 * Features:
 * - ✅ Suporte a SMTP genérico
 * - ✅ Templates HTML profissionais
 * - ✅ Envio em lote
 * - ✅ Pool de conexões
 * - ✅ Rate limiting
 * - ✅ Cache de templates
 * - ✅ Logs estruturados
 * 
 * Endpoints disponíveis:
 * - POST /email/send - Envio simples
 * - POST /email/send-template - Envio com template
 * - POST /email/send-bulk-template - Envio em lote
 * - POST /email/test/:email - Email de teste
 * - GET /email/status - Status do serviço
 * - GET /email/templates - Lista templates
 * - GET /email/templates/:type/preview - Preview template
 * - POST /email/clear-cache - Limpar cache
 */
@Module({
  imports: [
    ConfigModule, // Para acessar variáveis de ambiente
  ],
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService], // Exportar para uso em outros módulos
})
export class EmailModule {
  constructor() {
    console.log('🚀 EmailModule initialized successfully');
  }
}
