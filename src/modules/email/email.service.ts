import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import {
  EmailConfig,
  EmailOptions,
  EmailSendResult,
  EmailTemplate,
  TemplateData,
} from './interfaces';
import {
  SendEmailDto,
  EmailTemplateDto,
  EmailTemplateType,
  BulkEmailTemplateDto,
} from './dto';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private emailConfig: EmailConfig;
  private templatesCache: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.emailConfig = this.getEmailConfiguration();
    this.createTransporter();
    this.preloadTemplates();
  }

  /**
   * Obter configuração de email do ConfigService
   */
  private getEmailConfiguration(): EmailConfig {
    return {
      host: this.configService.get<string>('EMAIL_HOST', 'smtp.gmail.com'),
      port: this.configService.get<number>('EMAIL_PORT', 587),
      secure: this.configService.get<boolean>('EMAIL_SECURE', false),
      auth: {
        user: this.configService.get<string>('EMAIL_USER', ''),
        pass: this.configService.get<string>('EMAIL_PASS', ''),
      },
      from: {
        name: this.configService.get<string>(
          'EMAIL_FROM_NAME',
          'NeuralContent',
        ),
        address: this.configService.get<string>(
          'EMAIL_FROM_ADDRESS',
          'noreply@neuralcontent.com',
        ),
      },
      tls: {
        rejectUnauthorized: this.configService.get<boolean>(
          'EMAIL_TLS_REJECT_UNAUTHORIZED',
          false,
        ),
      },
    };
  }

  /**
   * Criar transporter do Nodemailer
   */
  private createTransporter(): void {
    try {
      this.transporter = nodemailer.createTransport({
        host: this.emailConfig.host,
        port: this.emailConfig.port,
        secure: this.emailConfig.secure,
        auth: this.emailConfig.auth,
        tls: this.emailConfig.tls,
        pool: true, // Usar pool de conexões
        maxConnections: 5,
        maxMessages: 100,
        rateDelta: 1000, // 1 segundo
        rateLimit: 5, // máximo 5 emails por segundo
      });

      // Verificar conexão
      this.verifyConnection();
    } catch (error) {
      this.logger.error('Erro ao criar transporter de email:', error);
      throw new Error('Falha na configuração do servidor de email');
    }
  }

  /**
   * Verificar conexão com servidor SMTP
   */
  private async verifyConnection(): Promise<void> {
    try {
      // Só verificar se email está configurado
      const emailUser = this.configService.get<string>('EMAIL_USER', '');
      if (!emailUser || emailUser === 'your-email@gmail.com') {
        this.logger.warn('Email não configurado - serviço funcionará em modo mock');
        return;
      }

      await this.transporter.verify();
      this.logger.log('Conexão com servidor SMTP verificada com sucesso');
    } catch (error) {
      this.logger.warn('Aviso: Erro na verificação do servidor SMTP (modo desenvolvimento):', error.message);
      // Em desenvolvimento, não quebrar a aplicação
    }
  }

  /**
   * Pré-carregar templates Handlebars em cache
   */
  private preloadTemplates(): void {
    const templatesDir = path.join(__dirname, 'templates');
    const templateFiles = [
      'welcome.hbs',
      'verification.hbs',
      'password-recovery.hbs',
      'payment-confirmation.hbs',
    ];

    templateFiles.forEach((file) => {
      try {
        const templatePath = path.join(templatesDir, file);
        if (fs.existsSync(templatePath)) {
          const templateContent = fs.readFileSync(templatePath, 'utf8');
          const compiled = handlebars.compile(templateContent);
          const templateName = file.replace('.hbs', '');
          this.templatesCache.set(templateName, compiled);
          this.logger.log(`Template ${templateName} carregado com sucesso`);
        }
      } catch (error) {
        this.logger.warn(`Erro ao carregar template ${file}:`, error);
      }
    });
  }

  /**
   * Obter template compilado
   */
  private getTemplate(templateName: string): HandlebarsTemplateDelegate | null {
    return this.templatesCache.get(templateName) || null;
  }

  /**
   * Renderizar template com dados
   */
  private renderTemplate(
    templateName: string,
    data: TemplateData,
  ): EmailTemplate {
    const template = this.getTemplate(templateName);
    
    if (!template) {
      throw new Error(`Template '${templateName}' não encontrado`);
    }

    try {
      // Dados padrão para todos os templates
      const defaultData = {
        websiteUrl: this.configService.get<string>(
          'FRONTEND_URL',
          'https://neuralcontent.com',
        ),
        dashboardUrl: this.configService.get<string>(
          'FRONTEND_URL',
          'https://app.neuralcontent.com',
        ),
        helpUrl: 'https://neuralcontent.com/ajuda',
        blogUrl: 'https://neuralcontent.com/blog',
        unsubscribeUrl: 'https://neuralcontent.com/unsubscribe',
        companyName: 'NeuralContent',
        supportEmail: 'suporte@neuralcontent.com',
        currentYear: new Date().getFullYear(),
      };

      const templateData = { ...defaultData, ...data };
      const html = template(templateData);

      // Gerar versão em texto plano
      const text = this.generateTextFromHtml(html);

      return {
        subject: this.generateSubject(templateName, templateData),
        html,
        text,
      };
    } catch (error) {
      this.logger.error(`Erro ao renderizar template ${templateName}:`, error);
      throw new Error('Falha na renderização do template de email');
    }
  }

  /**
   * Gerar assunto baseado no template
   */
  private generateSubject(templateName: string, data: TemplateData): string {
    const subjects: Record<string, string> = {
      welcome: `Bem-vindo ao NeuralContent, ${data.userName || 'usuário'}!`,
      verification: 'Confirme seu email - NeuralContent',
      'password-recovery': 'Recuperação de senha - NeuralContent',
      'payment-confirmation': 'Pagamento confirmado - NeuralContent',
    };

    return subjects[templateName] || 'NeuralContent - Notificação';
  }

  /**
   * Gerar versão em texto plano do HTML
   */
  private generateTextFromHtml(html: string): string {
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }

  /**
   * Enviar email simples
   */
  async sendEmail(emailDto: SendEmailDto): Promise<EmailSendResult> {
    try {
      const mailOptions = {
        from: `${this.emailConfig.from.name} <${this.emailConfig.from.address}>`,
        to: emailDto.to,
        cc: emailDto.cc,
        bcc: emailDto.bcc,
        subject: emailDto.subject,
        text: emailDto.text,
        html: emailDto.html,
        attachments: emailDto.attachments,
        replyTo: emailDto.replyTo,
        priority: emailDto.priority,
        headers: emailDto.headers,
      };

      const info = await this.transporter.sendMail(mailOptions);

      this.logger.log(`Email enviado com sucesso para ${emailDto.to}`);
      this.logger.debug(`Message ID: ${info.messageId}`);

      return {
        success: true,
        messageId: info.messageId,
        response: info.response,
      };
    } catch (error) {
      this.logger.error(`Erro ao enviar email para ${emailDto.to}:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Enviar email usando template
   */
  async sendTemplateEmail(
    templateDto: EmailTemplateDto,
  ): Promise<EmailSendResult> {
    try {
      const templateName = templateDto.template.toString();
      const template = this.renderTemplate(templateName, templateDto.data || {});

      const emailDto: SendEmailDto = {
        to: templateDto.to,
        subject: template.subject,
        html: template.html,
        text: template.text,
        replyTo: templateDto.replyTo,
        priority: templateDto.priority,
      };

      return this.sendEmail(emailDto);
    } catch (error) {
      this.logger.error(
        `Erro ao enviar email template ${templateDto.template}:`,
        error,
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Enviar emails em lote usando template
   */
  async sendBulkTemplateEmail(
    bulkDto: BulkEmailTemplateDto,
  ): Promise<EmailSendResult[]> {
    const results: EmailSendResult[] = [];

    for (const recipient of bulkDto.recipients) {
      try {
        const templateDto: EmailTemplateDto = {
          template: bulkDto.template,
          to: recipient.email,
          data: { ...bulkDto.globalData, ...recipient.data },
          language: bulkDto.language,
        };

        const result = await this.sendTemplateEmail(templateDto);
        results.push(result);

        // Delay para evitar spam
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        this.logger.error(
          `Erro ao enviar email para ${recipient.email}:`,
          error,
        );
        results.push({
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Enviar email de teste
   */
  async sendTestEmail(to: string): Promise<EmailSendResult> {
    const testEmailDto: SendEmailDto = {
      to,
      subject: '✅ Teste de Configuração - NeuralContent Email Service',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">🧪 Email de Teste</h2>
          <p>Este é um email de teste para verificar se a configuração SMTP está funcionando corretamente.</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>📋 Informações do Teste:</h3>
            <ul>
              <li><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</li>
              <li><strong>Servidor:</strong> ${this.emailConfig.host}:${this.emailConfig.port}</li>
              <li><strong>Seguro:</strong> ${this.emailConfig.secure ? 'Sim' : 'Não'}</li>
              <li><strong>De:</strong> ${this.emailConfig.from.name} &lt;${this.emailConfig.from.address}&gt;</li>
            </ul>
          </div>
          <p style="color: #28a745;"><strong>✅ Configuração de email funcionando corretamente!</strong></p>
          <hr style="margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            Este é um email automático de teste do NeuralContent Email Service.
          </p>
        </div>
      `,
      text: `
Teste de Configuração - NeuralContent Email Service

Este é um email de teste para verificar se a configuração SMTP está funcionando corretamente.

Informações do Teste:
- Data/Hora: ${new Date().toLocaleString('pt-BR')}
- Servidor: ${this.emailConfig.host}:${this.emailConfig.port}
- Seguro: ${this.emailConfig.secure ? 'Sim' : 'Não'}
- De: ${this.emailConfig.from.name} <${this.emailConfig.from.address}>

✅ Configuração de email funcionando corretamente!

Este é um email automático de teste do NeuralContent Email Service.
      `,
    };

    return this.sendEmail(testEmailDto);
  }

  /**
   * Verificar status do serviço de email
   */
  async getEmailServiceStatus(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: any;
  }> {
    try {
      await this.transporter.verify();
      return {
        status: 'healthy',
        details: {
          host: this.emailConfig.host,
          port: this.emailConfig.port,
          secure: this.emailConfig.secure,
          templatesLoaded: this.templatesCache.size,
          connectionPool: true,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error.message,
          host: this.emailConfig.host,
          port: this.emailConfig.port,
        },
      };
    }
  }

  /**
   * Limpar cache de templates
   */
  clearTemplateCache(): void {
    this.templatesCache.clear();
    this.preloadTemplates();
    this.logger.log('Cache de templates limpo e recarregado');
  }

  /**
   * Fechar conexões (cleanup)
   */
  async onApplicationShutdown(): Promise<void> {
    if (this.transporter) {
      this.transporter.close();
      this.logger.log('Conexões de email fechadas');
    }
  }
}
