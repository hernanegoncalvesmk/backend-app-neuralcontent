import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Payment,
  PaymentStatus,
  PaymentMethod,
  PaymentType,
} from '../entities/payment.entity';
import {
  UserSubscription,
  SubscriptionStatus,
} from '../entities/user-subscription.entity';
import {
  CreatePaymentDto,
  CreatePaymentIntentDto,
} from '../dto/create-payment.dto';
import { StripeService } from './stripe.service';
import { PayPalService } from './paypal.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(UserSubscription)
    private readonly subscriptionRepository: Repository<UserSubscription>,
    private readonly stripeService: StripeService,
    private readonly paypalService: PayPalService,
  ) {}

  /**
   * Cria um novo pagamento
   */
  async createPayment(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const {
      userId,
      planId,
      amount,
      currency = 'BRL',
      paymentMethod,
      paymentType,
      metadata,
    } = createPaymentDto;

    // Criar registro de pagamento
    const payment = this.paymentRepository.create({
      userId,
      planId,
      amount,
      currency: currency.toUpperCase(),
      paymentMethod,
      paymentType,
      status: PaymentStatus.PENDING,
      metadata: metadata || {},
    });

    const savedPayment = await this.paymentRepository.save(payment);
    this.logger.log(`Payment created: ${savedPayment.id}`);

    return savedPayment;
  }

  /**
   * Cria um Payment Intent (Stripe ou PayPal)
   */
  async createPaymentIntent(
    createPaymentIntentDto: CreatePaymentIntentDto,
  ): Promise<{
    payment: Payment;
    clientSecret?: string;
    approvalUrl?: string;
  }> {
    const { planId, amount, paymentMethod, successUrl, cancelUrl, metadata } =
      createPaymentIntentDto;

    if (!amount && !planId) {
      throw new BadRequestException('Either amount or planId is required');
    }

    // Por enquanto, vamos usar um userId mock ou pegá-lo do contexto
    // Em produção, isso viria do usuário autenticado
    const userId = 'mock-user-id'; // TODO: pegar do contexto de autenticação

    // Determinar o valor do pagamento
    let paymentAmount = amount;
    if (planId && !amount) {
      // TODO: buscar o plano e pegar o valor
      paymentAmount = 2990; // Valor mock por enquanto
    }

    if (!paymentAmount) {
      throw new BadRequestException('Payment amount is required');
    }

    // Criar o pagamento primeiro
    const payment = await this.createPayment({
      userId,
      planId,
      amount: paymentAmount,
      currency: 'BRL',
      paymentMethod,
      paymentType: planId ? PaymentType.SUBSCRIPTION : PaymentType.ONE_TIME,
      metadata,
    });

    try {
      if (paymentMethod === PaymentMethod.STRIPE) {
        // Criar Payment Intent no Stripe
        const paymentIntent = await this.stripeService.createPaymentIntent(
          this.stripeService.convertToCents(paymentAmount),
          'brl',
          {
            paymentId: payment.id,
            userId: userId,
            planId: planId || '',
            ...metadata,
          },
        );

        // Atualizar pagamento com ID externo
        payment.externalPaymentId = paymentIntent.id;
        await this.paymentRepository.save(payment);

        return {
          payment,
          clientSecret: paymentIntent.client_secret || undefined,
        };
      } else if (paymentMethod === PaymentMethod.PAYPAL) {
        // Criar ordem no PayPal
        const order = await this.paypalService.createOrder({
          amount: paymentAmount,
          currency: 'BRL',
          returnUrl: successUrl || 'http://localhost:3000/payment/success',
          cancelUrl: cancelUrl || 'http://localhost:3000/payment/cancel',
          description: planId
            ? 'Assinatura NeuralContent'
            : 'Pagamento NeuralContent',
          metadata: {
            paymentId: payment.id,
            userId: userId,
            planId: planId || '',
            ...metadata,
          },
        });

        // Atualizar pagamento com ID externo
        payment.externalPaymentId = order.id;
        await this.paymentRepository.save(payment);

        const approvalUrl = this.paypalService.extractApprovalUrl(order.links);

        return {
          payment,
          approvalUrl: approvalUrl || undefined,
        };
      }

      throw new BadRequestException('Unsupported payment method');
    } catch (error) {
      // Se houve erro, marcar pagamento como falhou
      payment.status = PaymentStatus.FAILED;
      payment.failureReason = error.message;
      await this.paymentRepository.save(payment);

      throw error;
    }
  }

  /**
   * Confirma um pagamento
   */
  async confirmPayment(
    paymentId: string,
    externalData?: any,
  ): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new ConflictException('Payment is not in pending status');
    }

    if (!payment.externalPaymentId) {
      throw new BadRequestException('Payment has no external payment ID');
    }

    try {
      let confirmed = false;

      if (payment.paymentMethod === PaymentMethod.STRIPE) {
        // Verificar status no Stripe
        const paymentIntent = await this.stripeService.retrievePaymentIntent(
          payment.externalPaymentId,
        );
        confirmed = paymentIntent.status === 'succeeded';

        if (confirmed) {
          payment.confirmedAt = new Date();
          payment.gatewayResponse = paymentIntent;
        }
      } else if (payment.paymentMethod === PaymentMethod.PAYPAL) {
        // Capturar ordem no PayPal
        const captureResult = await this.paypalService.captureOrder(
          payment.externalPaymentId,
        );
        const captureInfo =
          this.paypalService.extractCaptureInfo(captureResult);

        confirmed = captureInfo?.status === 'COMPLETED';

        if (confirmed) {
          payment.confirmedAt = new Date();
          payment.gatewayResponse = captureResult;
        }
      }

      if (confirmed) {
        payment.status = PaymentStatus.COMPLETED;

        // Se é pagamento de assinatura, criar/atualizar assinatura
        if (
          payment.paymentType === PaymentType.SUBSCRIPTION &&
          payment.planId
        ) {
          await this.createOrUpdateSubscription(payment);
        }

        this.logger.log(`Payment confirmed: ${payment.id}`);
      } else {
        payment.status = PaymentStatus.FAILED;
        payment.failureReason = 'Payment not confirmed by gateway';
      }

      return await this.paymentRepository.save(payment);
    } catch (error) {
      payment.status = PaymentStatus.FAILED;
      payment.failureReason = error.message;
      await this.paymentRepository.save(payment);
      throw error;
    }
  }

  /**
   * Cancela um pagamento
   */
  async cancelPayment(paymentId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new ConflictException('Only pending payments can be cancelled');
    }

    try {
      if (
        payment.paymentMethod === PaymentMethod.STRIPE &&
        payment.externalPaymentId
      ) {
        await this.stripeService.cancelPaymentIntent(payment.externalPaymentId);
      }

      payment.status = PaymentStatus.CANCELLED;
      payment.cancelledAt = new Date();

      this.logger.log(`Payment cancelled: ${payment.id}`);
      return await this.paymentRepository.save(payment);
    } catch (error) {
      this.logger.error(`Error cancelling payment ${paymentId}:`, error);
      throw error;
    }
  }

  /**
   * Cria um reembolso
   */
  async createRefund(
    paymentId: string,
    amount?: number,
    reason?: string,
  ): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new ConflictException('Only completed payments can be refunded');
    }

    if (payment.refundedAmount >= payment.amount) {
      throw new ConflictException('Payment already fully refunded');
    }

    const refundAmount = amount || payment.amount - payment.refundedAmount;

    if (
      refundAmount <= 0 ||
      refundAmount > payment.amount - payment.refundedAmount
    ) {
      throw new BadRequestException('Invalid refund amount');
    }

    if (!payment.externalPaymentId) {
      throw new BadRequestException('Payment has no external payment ID');
    }

    try {
      if (payment.paymentMethod === PaymentMethod.STRIPE) {
        await this.stripeService.createRefund(
          payment.externalPaymentId,
          this.stripeService.convertToCents(refundAmount),
          reason as any,
        );
      } else if (payment.paymentMethod === PaymentMethod.PAYPAL) {
        // Para PayPal, você precisaria do capture ID
        const captureInfo = this.paypalService.extractCaptureInfo(
          payment.gatewayResponse,
        );
        if (captureInfo) {
          await this.paypalService.createRefund(
            captureInfo.captureId,
            refundAmount,
            payment.currency,
            reason,
          );
        }
      }

      payment.refundedAmount += refundAmount;

      if (payment.refundedAmount >= payment.amount) {
        payment.status = PaymentStatus.REFUNDED;
      }

      this.logger.log(
        `Refund created for payment ${paymentId}: ${refundAmount}`,
      );
      return await this.paymentRepository.save(payment);
    } catch (error) {
      this.logger.error(
        `Error creating refund for payment ${paymentId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Busca pagamentos de um usuário
   */
  async getUserPayments(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<{ payments: Payment[]; total: number }> {
    const [payments, total] = await this.paymentRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { payments, total };
  }

  /**
   * Busca um pagamento por ID
   */
  async getPaymentById(paymentId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  /**
   * Cria ou atualiza assinatura do usuário
   */
  private async createOrUpdateSubscription(
    payment: Payment,
  ): Promise<UserSubscription> {
    if (!payment.planId) {
      throw new BadRequestException('Plan ID is required for subscription');
    }

    const existingSubscription = await this.subscriptionRepository.findOne({
      where: {
        userId: payment.userId,
        planId: payment.planId,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    if (existingSubscription) {
      // Estender assinatura existente
      const daysToAdd = 30; // TODO: pegar do plano
      const currentBillingDate =
        existingSubscription.nextBillingDate || new Date();
      const newBillingDate = new Date(
        currentBillingDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000,
      );

      existingSubscription.nextBillingDate = newBillingDate;
      existingSubscription.updatedAt = new Date();

      this.logger.log(`Subscription extended for user ${payment.userId}`);
      return await this.subscriptionRepository.save(existingSubscription);
    } else {
      // Criar nova assinatura
      const startDate = new Date();
      const nextBillingDate = new Date(
        startDate.getTime() + 30 * 24 * 60 * 60 * 1000,
      ); // 30 dias

      const subscription = this.subscriptionRepository.create({
        userId: payment.userId,
        planId: payment.planId,
        status: SubscriptionStatus.ACTIVE,
        startDate: startDate,
        nextBillingDate,
        creditsGranted: 1000, // TODO: pegar do plano
        creditsUsed: 0,
        autoRenew: true,
        pricePaid: payment.amount / 100, // converter de centavos para valor decimal
        currency: payment.currency,
      });

      this.logger.log(`New subscription created for user ${payment.userId}`);
      return await this.subscriptionRepository.save(subscription);
    }
  }

  /**
   * Busca assinatura ativa de um usuário
   */
  async getUserActiveSubscription(
    userId: string,
  ): Promise<UserSubscription | null> {
    return await this.subscriptionRepository.findOne({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
      },
      order: { nextBillingDate: 'DESC' },
    });
  }

  /**
   * Lista todas as assinaturas de um usuário
   */
  async getUserSubscriptions(userId: string): Promise<UserSubscription[]> {
    return await this.subscriptionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Cria uma nova assinatura para um usuário
   */
  async createUserSubscription(
    createSubscriptionDto: any,
  ): Promise<UserSubscription> {
    this.logger.log(
      `Creating subscription for user ${createSubscriptionDto.userId}`,
    );

    try {
      const subscription = new UserSubscription();
      Object.assign(subscription, createSubscriptionDto);
      subscription.status =
        createSubscriptionDto.status || SubscriptionStatus.ACTIVE;

      const savedSubscription =
        await this.subscriptionRepository.save(subscription);
      this.logger.log(`Subscription created with ID: ${savedSubscription.id}`);

      return savedSubscription;
    } catch (error) {
      this.logger.error(`Error creating subscription: ${error.message}`);
      throw new BadRequestException('Erro ao criar assinatura');
    }
  }

  /**
   * Atualiza uma assinatura existente
   */
  async updateUserSubscription(
    subscriptionId: string,
    updateSubscriptionDto: any,
  ): Promise<UserSubscription> {
    this.logger.log(`Updating subscription ${subscriptionId}`);

    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Assinatura não encontrada');
    }

    try {
      Object.assign(subscription, updateSubscriptionDto);
      const updatedSubscription =
        await this.subscriptionRepository.save(subscription);

      this.logger.log(`Subscription ${subscriptionId} updated successfully`);
      return updatedSubscription;
    } catch (error) {
      this.logger.error(`Error updating subscription: ${error.message}`);
      throw new BadRequestException('Erro ao atualizar assinatura');
    }
  }

  /**
   * Cancela uma assinatura
   */
  async cancelUserSubscription(
    subscriptionId: string,
  ): Promise<{ message: string }> {
    this.logger.log(`Canceling subscription ${subscriptionId}`);

    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Assinatura não encontrada');
    }

    try {
      subscription.status = SubscriptionStatus.CANCELLED;
      subscription.cancelledAt = new Date();

      await this.subscriptionRepository.save(subscription);

      this.logger.log(`Subscription ${subscriptionId} canceled successfully`);
      return { message: 'Assinatura cancelada com sucesso' };
    } catch (error) {
      this.logger.error(`Error canceling subscription: ${error.message}`);
      throw new BadRequestException('Erro ao cancelar assinatura');
    }
  }
}
