import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { EmailService } from './email.service';
import {
  SendEmailDto,
  EmailTemplateDto,
  BulkEmailTemplateDto,
  EmailTemplateType,
} from './dto';
import { EmailSendResult } from './interfaces';

@ApiTags('Email')
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  /**
   * Enviar email simples
   */
  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Enviar email simples',
    description: 'Envia um email simples para um ou mais destinatários',
  })
  @ApiResponse({
    status: 200,
    description: 'Email enviado com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        messageId: { type: 'string' },
        response: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Dados de email inválidos',
  })
  async sendEmail(@Body() emailDto: SendEmailDto): Promise<EmailSendResult> {
    return this.emailService.sendEmail(emailDto);
  }

  /**
   * Enviar email usando template
   */
  @Post('send-template')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Enviar email com template',
    description: 'Envia um email usando um template pré-definido',
  })
  @ApiResponse({
    status: 200,
    description: 'Email template enviado com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        messageId: { type: 'string' },
        response: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Dados de template inválidos',
  })
  async sendTemplateEmail(
    @Body() templateDto: EmailTemplateDto,
  ): Promise<EmailSendResult> {
    return this.emailService.sendTemplateEmail(templateDto);
  }

  /**
   * Enviar emails em lote usando template
   */
  @Post('send-bulk-template')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Enviar emails em lote com template',
    description: 'Envia emails em lote usando um template pré-definido',
  })
  @ApiResponse({
    status: 200,
    description: 'Emails em lote enviados',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          messageId: { type: 'string' },
          response: { type: 'string' },
          error: { type: 'string' },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Dados de envio em lote inválidos',
  })
  async sendBulkTemplateEmail(
    @Body() bulkDto: BulkEmailTemplateDto,
  ): Promise<EmailSendResult[]> {
    return this.emailService.sendBulkTemplateEmail(bulkDto);
  }

  /**
   * Enviar email de teste
   */
  @Post('test/:email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Enviar email de teste',
    description: 'Envia um email de teste para verificar a configuração SMTP',
  })
  @ApiParam({
    name: 'email',
    description: 'Email de destino para o teste',
    example: 'teste@exemplo.com',
  })
  @ApiResponse({
    status: 200,
    description: 'Email de teste enviado com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        messageId: { type: 'string' },
        response: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Email inválido',
  })
  async sendTestEmail(@Param('email') email: string): Promise<EmailSendResult> {
    return this.emailService.sendTestEmail(email);
  }

  /**
   * Obter status do serviço de email
   */
  @Get('status')
  @ApiOperation({
    summary: 'Status do serviço de email',
    description: 'Verifica o status e configuração do serviço de email',
  })
  @ApiResponse({
    status: 200,
    description: 'Status do serviço de email',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['healthy', 'unhealthy'],
        },
        details: {
          type: 'object',
          properties: {
            host: { type: 'string' },
            port: { type: 'number' },
            secure: { type: 'boolean' },
            templatesLoaded: { type: 'number' },
            connectionPool: { type: 'boolean' },
          },
        },
      },
    },
  })
  async getEmailServiceStatus(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: any;
  }> {
    return this.emailService.getEmailServiceStatus();
  }

  /**
   * Limpar cache de templates
   */
  @Post('clear-cache')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Limpar cache de templates',
    description: 'Limpa e recarrega o cache de templates de email',
  })
  @ApiResponse({
    status: 200,
    description: 'Cache de templates limpo com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        timestamp: { type: 'string' },
      },
    },
  })
  async clearTemplateCache(): Promise<{
    message: string;
    timestamp: string;
  }> {
    this.emailService.clearTemplateCache();
    return {
      message: 'Cache de templates limpo e recarregado com sucesso',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Listar tipos de templates disponíveis
   */
  @Get('templates')
  @ApiOperation({
    summary: 'Listar templates disponíveis',
    description: 'Retorna a lista de templates de email disponíveis',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de templates disponíveis',
    schema: {
      type: 'object',
      properties: {
        templates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              variables: {
                type: 'array',
                items: { type: 'string' },
              },
            },
          },
        },
      },
    },
  })
  async getAvailableTemplates(): Promise<{
    templates: Array<{
      type: string;
      name: string;
      description: string;
      variables: string[];
    }>;
  }> {
    const templates = [
      {
        type: EmailTemplateType.WELCOME,
        name: 'Boas-vindas',
        description: 'Email de boas-vindas para novos usuários',
        variables: [
          'userName',
          'userEmail',
          'dashboardUrl',
          'activationUrl',
          'websiteUrl',
        ],
      },
      {
        type: EmailTemplateType.VERIFICATION,
        name: 'Verificação de Email',
        description: 'Email para verificação de conta',
        variables: [
          'userName',
          'verificationUrl',
          'verificationCode',
          'expirationTime',
        ],
      },
      {
        type: EmailTemplateType.PASSWORD_RECOVERY,
        name: 'Recuperação de Senha',
        description: 'Email para recuperação de senha',
        variables: [
          'userName',
          'resetUrl',
          'resetCode',
          'expirationTime',
          'ipAddress',
        ],
      },
      {
        type: EmailTemplateType.PAYMENT_CONFIRMATION,
        name: 'Confirmação de Pagamento',
        description: 'Email de confirmação de pagamento',
        variables: [
          'userName',
          'planName',
          'amount',
          'currency',
          'transactionId',
          'paymentDate',
          'nextBillingDate',
          'invoiceUrl',
          'dashboardUrl',
        ],
      },
    ];

    return { templates };
  }

  /**
   * Preview de template
   */
  @Get('templates/:type/preview')
  @ApiOperation({
    summary: 'Preview de template',
    description: 'Gera um preview do template com dados de exemplo',
  })
  @ApiParam({
    name: 'type',
    description: 'Tipo do template',
    enum: EmailTemplateType,
  })
  @ApiQuery({
    name: 'format',
    description: 'Formato do preview',
    enum: ['html', 'text'],
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Preview do template gerado',
    schema: {
      type: 'object',
      properties: {
        subject: { type: 'string' },
        html: { type: 'string' },
        text: { type: 'string' },
        templateType: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Tipo de template inválido',
  })
  async previewTemplate(
    @Param('type') type: EmailTemplateType,
    @Query('format') format: 'html' | 'text' = 'html',
  ): Promise<{
    subject: string;
    html?: string;
    text?: string;
    templateType: string;
  }> {
    // Dados de exemplo para preview
    const sampleData = {
      userName: 'João Silva',
      userEmail: 'joao.silva@exemplo.com',
      verificationUrl: 'https://app.neuralcontent.com/verify?token=sample',
      verificationCode: '123456',
      resetUrl: 'https://app.neuralcontent.com/reset?token=sample',
      resetCode: 'RESET123',
      planName: 'Plano Pro',
      amount: 'R$ 97,00',
      currency: 'BRL',
      transactionId: 'TXN_123456789',
      paymentDate: new Date().toLocaleDateString('pt-BR'),
      nextBillingDate: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      ).toLocaleDateString('pt-BR'),
      invoiceUrl: 'https://app.neuralcontent.com/invoice/sample',
      dashboardUrl: 'https://app.neuralcontent.com/dashboard',
      activationUrl: 'https://app.neuralcontent.com/activate?token=sample',
      expirationTime: '24 horas',
      ipAddress: '192.168.1.1',
    };

    const templateDto: EmailTemplateDto = {
      template: type,
      to: 'preview@exemplo.com',
      data: sampleData,
    };

    // Para preview, renderizamos o template mas não enviamos
    try {
      const result = await this.emailService.sendTemplateEmail({
        ...templateDto,
        to: 'preview-only@neuralcontent.com', // Email fictício
      });

      return {
        subject: `Preview - ${type}`,
        ...(format === 'html' ? { html: 'Template HTML renderizado' } : {}),
        ...(format === 'text' ? { text: 'Template texto renderizado' } : {}),
        templateType: type,
      };
    } catch (error) {
      return {
        subject: `Preview Error - ${type}`,
        html: `Erro ao renderizar template: ${error.message}`,
        templateType: type,
      };
    }
  }
}
