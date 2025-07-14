import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { CreatePaymentIntentDto } from '../dto/create-payment.dto';
import { PaymentMethod } from '../entities/payment.entity';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    
    if (!secretKey) {
      this.logger.error('STRIPE_SECRET_KEY not found in environment variables');
      throw new Error('Stripe configuration is missing');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-06-30.basil',
      typescript: true,
    });

    this.logger.log('Stripe service initialized successfully');
  }

  /**
   * Cria um Payment Intent no Stripe
   */
  async createPaymentIntent(
    amount: number,
    currency: string = 'brl',
    metadata: Record<string, string> = {},
  ): Promise<Stripe.PaymentIntent> {
    try {
      this.logger.log(`Creating payment intent for amount: ${amount} ${currency.toUpperCase()}`);

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency: currency.toLowerCase(),
        automatic_payment_methods: {
          enabled: true,
        },
        metadata,
      });

      this.logger.log(`Payment intent created successfully: ${paymentIntent.id}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error('Error creating payment intent:', error);
      throw new BadRequestException('Failed to create payment intent');
    }
  }

  /**
   * Cria uma sessão de checkout no Stripe
   */
  async createCheckoutSession(data: {
    amount: number;
    currency?: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
    customerEmail?: string;
  }): Promise<Stripe.Checkout.Session> {
    try {
      this.logger.log(`Creating checkout session for amount: ${data.amount}`);

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: data.currency?.toLowerCase() || 'brl',
              product_data: {
                name: 'NeuralContent - Pagamento',
              },
              unit_amount: data.amount,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: data.successUrl,
        cancel_url: data.cancelUrl,
        metadata: data.metadata || {},
        customer_email: data.customerEmail,
      });

      this.logger.log(`Checkout session created successfully: ${session.id}`);
      return session;
    } catch (error) {
      this.logger.error('Error creating checkout session:', error);
      throw new BadRequestException('Failed to create checkout session');
    }
  }

  /**
   * Cria uma sessão de checkout para assinatura
   */
  async createSubscriptionCheckoutSession(data: {
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
    customerEmail?: string;
    trialPeriodDays?: number;
  }): Promise<Stripe.Checkout.Session> {
    try {
      this.logger.log(`Creating subscription checkout session for price: ${data.priceId}`);

      const sessionData: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ['card'],
        line_items: [
          {
            price: data.priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: data.successUrl,
        cancel_url: data.cancelUrl,
        metadata: data.metadata || {},
        customer_email: data.customerEmail,
      };

      if (data.trialPeriodDays) {
        sessionData.subscription_data = {
          trial_period_days: data.trialPeriodDays,
        };
      }

      const session = await this.stripe.checkout.sessions.create(sessionData);

      this.logger.log(`Subscription checkout session created successfully: ${session.id}`);
      return session;
    } catch (error) {
      this.logger.error('Error creating subscription checkout session:', error);
      throw new BadRequestException('Failed to create subscription checkout session');
    }
  }

  /**
   * Recupera um Payment Intent
   */
  async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      this.logger.error(`Error retrieving payment intent ${paymentIntentId}:`, error);
      throw new BadRequestException('Failed to retrieve payment intent');
    }
  }

  /**
   * Recupera uma sessão de checkout
   */
  async retrieveCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
    try {
      return await this.stripe.checkout.sessions.retrieve(sessionId);
    } catch (error) {
      this.logger.error(`Error retrieving checkout session ${sessionId}:`, error);
      throw new BadRequestException('Failed to retrieve checkout session');
    }
  }

  /**
   * Cancela um Payment Intent
   */
  async cancelPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      this.logger.log(`Canceling payment intent: ${paymentIntentId}`);
      return await this.stripe.paymentIntents.cancel(paymentIntentId);
    } catch (error) {
      this.logger.error(`Error canceling payment intent ${paymentIntentId}:`, error);
      throw new BadRequestException('Failed to cancel payment intent');
    }
  }

  /**
   * Cria um reembolso
   */
  async createRefund(
    paymentIntentId: string,
    amount?: number,
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer',
  ): Promise<Stripe.Refund> {
    try {
      this.logger.log(`Creating refund for payment intent: ${paymentIntentId}`);

      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount,
        reason,
      });

      this.logger.log(`Refund created successfully: ${refund.id}`);
      return refund;
    } catch (error) {
      this.logger.error(`Error creating refund for ${paymentIntentId}:`, error);
      throw new BadRequestException('Failed to create refund');
    }
  }

  /**
   * Constroi evento do webhook
   */
  constructWebhookEvent(payload: string, signature: string): Stripe.Event {
    try {
      const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
      
      if (!webhookSecret) {
        throw new Error('Stripe webhook secret not configured');
      }

      return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      this.logger.error('Error constructing webhook event:', error);
      throw new BadRequestException('Invalid webhook signature');
    }
  }

  /**
   * Cria ou atualiza um cliente no Stripe
   */
  async createOrUpdateCustomer(data: {
    email: string;
    name?: string;
    metadata?: Record<string, string>;
    customerId?: string;
  }): Promise<Stripe.Customer> {
    try {
      if (data.customerId) {
        // Atualizar cliente existente
        this.logger.log(`Updating Stripe customer: ${data.customerId}`);
        return await this.stripe.customers.update(data.customerId, {
          email: data.email,
          name: data.name,
          metadata: data.metadata,
        });
      } else {
        // Criar novo cliente
        this.logger.log(`Creating new Stripe customer for email: ${data.email}`);
        return await this.stripe.customers.create({
          email: data.email,
          name: data.name,
          metadata: data.metadata,
        });
      }
    } catch (error) {
      this.logger.error('Error creating/updating Stripe customer:', error);
      throw new BadRequestException('Failed to create/update customer');
    }
  }

  /**
   * Lista métodos de pagamento de um cliente
   */
  async listCustomerPaymentMethods(
    customerId: string,
    type: 'card' | 'sepa_debit' | 'us_bank_account' = 'card',
  ): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type,
      });

      return paymentMethods.data;
    } catch (error) {
      this.logger.error(`Error listing payment methods for customer ${customerId}:`, error);
      throw new BadRequestException('Failed to list payment methods');
    }
  }

  /**
   * Formata valor em centavos para exibição
   */
  formatAmount(amountInCents: number, currency: string = 'BRL'): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amountInCents / 100);
  }

  /**
   * Converte valor em reais para centavos
   */
  convertToCents(amount: number): number {
    return Math.round(amount * 100);
  }

  /**
   * Converte valor em centavos para reais
   */
  convertFromCents(amountInCents: number): number {
    return amountInCents / 100;
  }
}
