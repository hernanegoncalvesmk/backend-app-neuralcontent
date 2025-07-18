import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsEnum,
  IsEmail,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum EmailTemplateType {
  WELCOME = 'welcome',
  VERIFICATION = 'verification',
  PASSWORD_RECOVERY = 'password-recovery',
  PAYMENT_CONFIRMATION = 'payment-confirmation',
  SUBSCRIPTION_CONFIRMED = 'subscription-confirmed',
  SUBSCRIPTION_CANCELLED = 'subscription-cancelled',
  CREDIT_PURCHASE = 'credit-purchase',
  ACCOUNT_SUSPENDED = 'account-suspended',
  SECURITY_ALERT = 'security-alert',
  NEWSLETTER = 'newsletter',
}

export class EmailTemplateDto {
  @ApiProperty({
    description: 'Tipo do template de email',
    enum: EmailTemplateType,
    example: EmailTemplateType.WELCOME,
  })
  @IsEnum(EmailTemplateType)
  @IsNotEmpty()
  template: EmailTemplateType;

  @ApiProperty({
    description: 'Email do destinatário',
    example: 'usuario@neuralcontent.com',
  })
  @IsEmail()
  @IsNotEmpty()
  to: string;

  @ApiPropertyOptional({
    description: 'Dados para preencher o template',
    example: {
      userName: 'João Silva',
      verificationLink: 'https://app.neuralcontent.com/verify?token=abc123',
    },
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Idioma do template',
    example: 'pt-BR',
    default: 'pt-BR',
  })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({
    description: 'Email de resposta personalizado',
    example: 'suporte@neuralcontent.com',
  })
  @IsOptional()
  @IsEmail()
  replyTo?: string;

  @ApiPropertyOptional({
    description: 'Prioridade do email',
    example: 'normal',
    enum: ['high', 'normal', 'low'],
    default: 'normal',
  })
  @IsOptional()
  @IsString()
  priority?: 'high' | 'normal' | 'low';
}

export class BulkEmailTemplateDto {
  @ApiProperty({
    description: 'Tipo do template de email',
    enum: EmailTemplateType,
    example: EmailTemplateType.NEWSLETTER,
  })
  @IsEnum(EmailTemplateType)
  @IsNotEmpty()
  template: EmailTemplateType;

  @ApiProperty({
    description: 'Lista de destinatários com dados individuais',
    example: [
      {
        email: 'usuario1@neuralcontent.com',
        data: { userName: 'João Silva' },
      },
      {
        email: 'usuario2@neuralcontent.com',
        data: { userName: 'Maria Santos' },
      },
    ],
  })
  @IsObject({ each: true })
  recipients: Array<{
    email: string;
    data?: Record<string, any>;
  }>;

  @ApiPropertyOptional({
    description: 'Dados globais para todos os templates',
    example: { companyName: 'NeuralContent' },
  })
  @IsOptional()
  @IsObject()
  globalData?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Idioma dos templates',
    example: 'pt-BR',
    default: 'pt-BR',
  })
  @IsOptional()
  @IsString()
  language?: string;
}
