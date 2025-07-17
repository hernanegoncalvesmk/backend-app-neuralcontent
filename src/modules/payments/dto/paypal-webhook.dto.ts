import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsObject,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
  IsDateString,
} from 'class-validator';

export enum PayPalEventType {
  PAYMENT_CAPTURE_COMPLETED = 'PAYMENT.CAPTURE.COMPLETED',
  PAYMENT_CAPTURE_DENIED = 'PAYMENT.CAPTURE.DENIED',
  PAYMENT_CAPTURE_PENDING = 'PAYMENT.CAPTURE.PENDING',
  PAYMENT_CAPTURE_REFUNDED = 'PAYMENT.CAPTURE.REFUNDED',
  PAYMENT_CAPTURE_REVERSED = 'PAYMENT.CAPTURE.REVERSED',

  CHECKOUT_ORDER_APPROVED = 'CHECKOUT.ORDER.APPROVED',
  CHECKOUT_ORDER_COMPLETED = 'CHECKOUT.ORDER.COMPLETED',

  BILLING_SUBSCRIPTION_CREATED = 'BILLING.SUBSCRIPTION.CREATED',
  BILLING_SUBSCRIPTION_ACTIVATED = 'BILLING.SUBSCRIPTION.ACTIVATED',
  BILLING_SUBSCRIPTION_UPDATED = 'BILLING.SUBSCRIPTION.UPDATED',
  BILLING_SUBSCRIPTION_EXPIRED = 'BILLING.SUBSCRIPTION.EXPIRED',
  BILLING_SUBSCRIPTION_CANCELLED = 'BILLING.SUBSCRIPTION.CANCELLED',
  BILLING_SUBSCRIPTION_SUSPENDED = 'BILLING.SUBSCRIPTION.SUSPENDED',
  BILLING_SUBSCRIPTION_PAYMENT_FAILED = 'BILLING.SUBSCRIPTION.PAYMENT.FAILED',

  INVOICING_INVOICE_PAID = 'INVOICING.INVOICE.PAID',
  INVOICING_INVOICE_CANCELLED = 'INVOICING.INVOICE.CANCELLED',
}

export class PayPalWebhookDto {
  @ApiProperty({
    description: 'ID único do evento no PayPal',
    example: 'WH-2WR32451HC0233532-67976317FL4543714',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Timestamp de criação do evento',
    example: '2025-07-14T10:30:00Z',
  })
  @IsDateString()
  create_time: string;

  @ApiProperty({
    description: 'Tipo do evento',
    enum: PayPalEventType,
    example: PayPalEventType.PAYMENT_CAPTURE_COMPLETED,
  })
  @IsEnum(PayPalEventType)
  event_type: PayPalEventType;

  @ApiProperty({
    description: 'Versão do evento',
    example: '1.0',
  })
  @IsString()
  event_version: string;

  @ApiProperty({
    description: 'Dados do recurso do evento',
    example: {
      id: '5O190127TN364715T',
      amount: {
        currency_code: 'BRL',
        value: '29.90',
      },
      status: 'COMPLETED',
    },
  })
  @IsObject()
  resource: any;

  @ApiProperty({
    description: 'Tipo do recurso',
    example: 'capture',
  })
  @IsString()
  resource_type: string;

  @ApiProperty({
    description: 'Resumo do evento',
    example: 'Payment completed for $ 29.90 BRL',
    required: false,
  })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiProperty({
    description: 'Links relacionados ao evento',
    example: [
      {
        href: 'https://api.paypal.com/v2/payments/captures/5O190127TN364715T',
        rel: 'self',
        method: 'GET',
      },
    ],
    required: false,
  })
  @IsOptional()
  @IsArray()
  links?: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

export class PayPalCaptureData {
  @ApiProperty({
    description: 'ID da captura no PayPal',
    example: '5O190127TN364715T',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Valor da captura',
    example: {
      currency_code: 'BRL',
      value: '29.90',
    },
  })
  @IsObject()
  amount: {
    currency_code: string;
    value: string;
  };

  @ApiProperty({
    description: 'Status da captura',
    example: 'COMPLETED',
  })
  @IsString()
  status:
    | 'COMPLETED'
    | 'DECLINED'
    | 'PARTIALLY_REFUNDED'
    | 'REFUNDED'
    | 'PENDING';

  @ApiProperty({
    description: 'ID da invoice no PayPal',
    example: 'INV2-Z56S-5LXX-QZQX-7Q2H',
    required: false,
  })
  @IsOptional()
  @IsString()
  invoice_id?: string;

  @ApiProperty({
    description: 'Metadados customizados',
    example: { userId: '123e4567-e89b-12d3-a456-426614174000' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  custom_id?: string;

  @ApiProperty({
    description: 'Timestamp de criação',
    example: '2025-07-14T10:30:00Z',
  })
  @IsDateString()
  create_time: string;

  @ApiProperty({
    description: 'Timestamp de atualização',
    example: '2025-07-14T10:30:00Z',
  })
  @IsDateString()
  update_time: string;

  @ApiProperty({
    description: 'Detalhes do vendedor',
    required: false,
  })
  @IsOptional()
  @IsObject()
  seller_protection?: {
    status: string;
    dispute_categories: string[];
  };

  @ApiProperty({
    description: 'Taxa final cobrada',
    required: false,
  })
  @IsOptional()
  @IsObject()
  seller_receivable_breakdown?: {
    gross_amount: {
      currency_code: string;
      value: string;
    };
    paypal_fee: {
      currency_code: string;
      value: string;
    };
    net_amount: {
      currency_code: string;
      value: string;
    };
  };
}

export class PayPalOrderData {
  @ApiProperty({
    description: 'ID do pedido no PayPal',
    example: '5O190127TN364715T',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Status do pedido',
    example: 'COMPLETED',
  })
  @IsString()
  status:
    | 'CREATED'
    | 'SAVED'
    | 'APPROVED'
    | 'VOIDED'
    | 'COMPLETED'
    | 'PAYER_ACTION_REQUIRED';

  @ApiProperty({
    description: 'Intenção do pedido',
    example: 'CAPTURE',
  })
  @IsString()
  intent: 'CAPTURE' | 'AUTHORIZE';

  @ApiProperty({
    description: 'Unidades de compra',
    example: [
      {
        amount: {
          currency_code: 'BRL',
          value: '29.90',
        },
        reference_id: 'default',
      },
    ],
  })
  @IsArray()
  purchase_units: Array<{
    reference_id?: string;
    amount: {
      currency_code: string;
      value: string;
    };
    custom_id?: string;
    invoice_id?: string;
  }>;

  @ApiProperty({
    description: 'Detalhes do pagador',
    required: false,
  })
  @IsOptional()
  @IsObject()
  payer?: {
    name?: {
      given_name: string;
      surname: string;
    };
    email_address?: string;
    payer_id?: string;
  };

  @ApiProperty({
    description: 'Timestamp de criação',
    example: '2025-07-14T10:30:00Z',
  })
  @IsDateString()
  create_time: string;

  @ApiProperty({
    description: 'Timestamp de atualização',
    example: '2025-07-14T10:30:00Z',
  })
  @IsDateString()
  update_time: string;
}
