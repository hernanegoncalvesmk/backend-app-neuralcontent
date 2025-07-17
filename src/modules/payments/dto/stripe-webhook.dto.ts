import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsObject,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
} from 'class-validator';

export enum StripeEventType {
  PAYMENT_INTENT_SUCCEEDED = 'payment_intent.succeeded',
  PAYMENT_INTENT_PAYMENT_FAILED = 'payment_intent.payment_failed',
  PAYMENT_INTENT_CANCELED = 'payment_intent.canceled',
  PAYMENT_INTENT_CREATED = 'payment_intent.created',
  PAYMENT_INTENT_PROCESSING = 'payment_intent.processing',
  PAYMENT_INTENT_REQUIRES_ACTION = 'payment_intent.requires_action',

  CHECKOUT_SESSION_COMPLETED = 'checkout.session.completed',
  CHECKOUT_SESSION_EXPIRED = 'checkout.session.expired',

  INVOICE_PAYMENT_SUCCEEDED = 'invoice.payment_succeeded',
  INVOICE_PAYMENT_FAILED = 'invoice.payment_failed',
  INVOICE_FINALIZED = 'invoice.finalized',

  CUSTOMER_SUBSCRIPTION_CREATED = 'customer.subscription.created',
  CUSTOMER_SUBSCRIPTION_UPDATED = 'customer.subscription.updated',
  CUSTOMER_SUBSCRIPTION_DELETED = 'customer.subscription.deleted',
  CUSTOMER_SUBSCRIPTION_TRIAL_WILL_END = 'customer.subscription.trial_will_end',

  CUSTOMER_CREATED = 'customer.created',
  CUSTOMER_UPDATED = 'customer.updated',
  CUSTOMER_DELETED = 'customer.deleted',
}

export class StripeWebhookDto {
  @ApiProperty({
    description: 'ID único do evento no Stripe',
    example: 'evt_1234567890abcdef',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Objeto que identifica o tipo de webhook',
    example: 'event',
  })
  @IsString()
  object: string;

  @ApiProperty({
    description: 'Versão da API do Stripe',
    example: '2023-10-16',
  })
  @IsString()
  api_version: string;

  @ApiProperty({
    description: 'Timestamp de criação do evento',
    example: 1690876800,
  })
  @IsNumber()
  created: number;

  @ApiProperty({
    description: 'Dados do evento',
    example: {
      object: {
        id: 'pi_1234567890abcdef',
        amount: 2990,
        currency: 'brl',
        status: 'succeeded',
      },
    },
  })
  @IsObject()
  data: {
    object: any;
    previous_attributes?: any;
  };

  @ApiProperty({
    description: 'Modo de operação (live ou test)',
    example: false,
  })
  @IsOptional()
  livemode?: boolean;

  @ApiProperty({
    description: 'Número de tentativas de entrega do webhook',
    example: 1,
  })
  @IsNumber()
  pending_webhooks: number;

  @ApiProperty({
    description: 'ID da requisição que originou o evento',
    example: 'req_1234567890abcdef',
    required: false,
  })
  @IsOptional()
  @IsString()
  request?: string;

  @ApiProperty({
    description: 'Tipo do evento',
    enum: StripeEventType,
    example: StripeEventType.PAYMENT_INTENT_SUCCEEDED,
  })
  @IsEnum(StripeEventType)
  type: StripeEventType;
}

export class StripePaymentIntentData {
  @ApiProperty({
    description: 'ID do Payment Intent',
    example: 'pi_1234567890abcdef',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Valor em centavos',
    example: 2990,
  })
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'Valor recebido em centavos',
    example: 2990,
  })
  @IsNumber()
  amount_received: number;

  @ApiProperty({
    description: 'Moeda',
    example: 'brl',
  })
  @IsString()
  currency: string;

  @ApiProperty({
    description: 'ID do cliente no Stripe',
    example: 'cus_1234567890abcdef',
    required: false,
  })
  @IsOptional()
  @IsString()
  customer?: string;

  @ApiProperty({
    description: 'Descrição do pagamento',
    example: 'Assinatura Premium - Mensal',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Status do pagamento',
    example: 'succeeded',
  })
  @IsString()
  status: string;

  @ApiProperty({
    description: 'Métodos de pagamento utilizados',
    example: ['card'],
  })
  @IsArray()
  payment_method_types: string[];

  @ApiProperty({
    description: 'Metadados customizados',
    example: { userId: '123e4567-e89b-12d3-a456-426614174000' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;

  @ApiProperty({
    description: 'Timestamp de criação',
    example: 1690876800,
  })
  @IsNumber()
  created: number;
}

export class StripeCheckoutSessionData {
  @ApiProperty({
    description: 'ID da sessão de checkout',
    example: 'cs_1234567890abcdef',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Valor total em centavos',
    example: 2990,
  })
  @IsNumber()
  amount_total: number;

  @ApiProperty({
    description: 'Moeda',
    example: 'brl',
  })
  @IsString()
  currency: string;

  @ApiProperty({
    description: 'ID do cliente no Stripe',
    example: 'cus_1234567890abcdef',
    required: false,
  })
  @IsOptional()
  @IsString()
  customer?: string;

  @ApiProperty({
    description: 'Email do cliente',
    example: 'cliente@example.com',
    required: false,
  })
  @IsOptional()
  @IsString()
  customer_email?: string;

  @ApiProperty({
    description: 'ID do Payment Intent associado',
    example: 'pi_1234567890abcdef',
    required: false,
  })
  @IsOptional()
  @IsString()
  payment_intent?: string;

  @ApiProperty({
    description: 'Status da sessão',
    example: 'complete',
  })
  @IsString()
  payment_status: string;

  @ApiProperty({
    description: 'Modo da sessão',
    example: 'payment',
  })
  @IsString()
  mode: 'payment' | 'subscription' | 'setup';

  @ApiProperty({
    description: 'Metadados customizados',
    example: { userId: '123e4567-e89b-12d3-a456-426614174000' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;
}
