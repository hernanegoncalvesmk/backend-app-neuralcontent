/**
 * Exports do módulo Email
 * 
 * Este arquivo centraliza todas as exportações do módulo de email
 * para facilitar a importação em outros módulos da aplicação.
 */

// Módulo principal
export { EmailModule } from './email.module';

// Serviços
export { EmailService } from './email.service';

// Controladores
export { EmailController } from './email.controller';

// DTOs
export {
  SendEmailDto,
  EmailTemplateDto,
  BulkEmailTemplateDto,
  EmailTemplateType,
} from './dto';

// Interfaces
export {
  EmailConfig,
  EmailOptions,
  EmailSendResult,
  EmailTemplate,
  EmailAttachment,
  TemplateData,
  EmailQueue,
} from './interfaces';

// Re-export para compatibilidade
export type { EmailService as IEmailService } from './email.service';
