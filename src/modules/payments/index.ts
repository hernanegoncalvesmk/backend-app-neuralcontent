export * from './payments.module';
export * from './payments.controller';
export * from './services';
export * from './entities';

// DTOs - exportação explícita para evitar conflitos
export {
  CreatePaymentDto,
  CreatePaymentIntentDto,
  CreateUserSubscriptionDto,
  UpdateUserSubscriptionDto,
  CancelSubscriptionDto,
  CancelSubscriptionResponseDto,
  CancellationReason,
  StripeWebhookDto,
  StripeEventType,
  StripePaymentIntentData,
  StripeCheckoutSessionData,
  PayPalWebhookDto,
  PayPalEventType,
  PayPalCaptureData,
  PayPalOrderData,
} from './dto';
