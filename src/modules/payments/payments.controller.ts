import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
  RawBody,
  UseGuards,
  Req,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PaymentsService } from './services/payments.service';
import { StripeService } from './services/stripe.service';
import { PayPalService } from './services/paypal.service';
import { CreatePaymentDto, CreatePaymentIntentDto } from './dto/create-payment.dto';
import { StripeWebhookDto } from './dto/stripe-webhook.dto';
import { PayPalWebhookDto } from './dto/paypal-webhook.dto';
import { Payment } from './entities/payment.entity';
import { UserSubscription } from './entities/user-subscription.entity';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly stripeService: StripeService,
    private readonly paypalService: PayPalService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo pagamento' })
  @ApiResponse({ 
    status: 201, 
    description: 'Pagamento criado com sucesso',
    type: Payment,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Usuário ou plano não encontrado' })
  async createPayment(@Body() createPaymentDto: CreatePaymentDto): Promise<Payment> {
    this.logger.log(`Creating payment for user: ${createPaymentDto.userId}`);
    return await this.paymentsService.createPayment(createPaymentDto);
  }

  @Post('intent')
  @ApiOperation({ summary: 'Criar intenção de pagamento (Stripe/PayPal)' })
  @ApiResponse({ 
    status: 201, 
    description: 'Intenção de pagamento criada com sucesso',
    schema: {
      type: 'object',
      properties: {
        payment: { $ref: '#/components/schemas/Payment' },
        clientSecret: { type: 'string', description: 'Client secret do Stripe (se aplicável)' },
        approvalUrl: { type: 'string', description: 'URL de aprovação do PayPal (se aplicável)' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async createPaymentIntent(@Body() createPaymentIntentDto: CreatePaymentIntentDto) {
    this.logger.log(`Creating payment intent for method: ${createPaymentIntentDto.paymentMethod}`);
    return await this.paymentsService.createPaymentIntent(createPaymentIntentDto);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirmar um pagamento' })
  @ApiResponse({ 
    status: 200, 
    description: 'Pagamento confirmado com sucesso',
    type: Payment,
  })
  @ApiResponse({ status: 404, description: 'Pagamento não encontrado' })
  @ApiResponse({ status: 409, description: 'Pagamento não está em estado pendente' })
  async confirmPayment(
    @Param('id', ParseUUIDPipe) paymentId: string,
    @Body() confirmData?: any,
  ): Promise<Payment> {
    this.logger.log(`Confirming payment: ${paymentId}`);
    return await this.paymentsService.confirmPayment(paymentId, confirmData);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancelar um pagamento pendente' })
  @ApiResponse({ 
    status: 200, 
    description: 'Pagamento cancelado com sucesso',
    type: Payment,
  })
  @ApiResponse({ status: 404, description: 'Pagamento não encontrado' })
  @ApiResponse({ status: 409, description: 'Apenas pagamentos pendentes podem ser cancelados' })
  async cancelPayment(@Param('id', ParseUUIDPipe) paymentId: string): Promise<Payment> {
    this.logger.log(`Cancelling payment: ${paymentId}`);
    return await this.paymentsService.cancelPayment(paymentId);
  }

  @Post(':id/refund')
  @ApiOperation({ summary: 'Criar reembolso para um pagamento' })
  @ApiResponse({ 
    status: 200, 
    description: 'Reembolso criado com sucesso',
    type: Payment,
  })
  @ApiResponse({ status: 404, description: 'Pagamento não encontrado' })
  @ApiResponse({ status: 409, description: 'Apenas pagamentos completos podem ser reembolsados' })
  async createRefund(
    @Param('id', ParseUUIDPipe) paymentId: string,
    @Body() refundData: { amount?: number; reason?: string },
  ): Promise<Payment> {
    this.logger.log(`Creating refund for payment: ${paymentId}`);
    return await this.paymentsService.createRefund(
      paymentId,
      refundData.amount,
      refundData.reason,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar um pagamento por ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Pagamento encontrado',
    type: Payment,
  })
  @ApiResponse({ status: 404, description: 'Pagamento não encontrado' })
  async getPaymentById(@Param('id', ParseUUIDPipe) paymentId: string): Promise<Payment> {
    return await this.paymentsService.getPaymentById(paymentId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Listar pagamentos de um usuário' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limite de resultados' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Offset para paginação' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de pagamentos do usuário',
    schema: {
      type: 'object',
      properties: {
        payments: { type: 'array', items: { $ref: '#/components/schemas/Payment' } },
        total: { type: 'number', description: 'Total de pagamentos' },
      },
    },
  })
  async getUserPayments(
    @Param('userId') userId: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    return await this.paymentsService.getUserPayments(userId, limit, offset);
  }

  @Get('subscriptions/user/:userId')
  @ApiOperation({ summary: 'Listar assinaturas de um usuário' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de assinaturas do usuário',
    type: [UserSubscription],
  })
  async getUserSubscriptions(@Param('userId') userId: string): Promise<UserSubscription[]> {
    return await this.paymentsService.getUserSubscriptions(userId);
  }

  @Get('subscriptions/user/:userId/active')
  @ApiOperation({ summary: 'Buscar assinatura ativa de um usuário' })
  @ApiResponse({ 
    status: 200, 
    description: 'Assinatura ativa do usuário',
    type: UserSubscription,
  })
  @ApiResponse({ status: 404, description: 'Assinatura ativa não encontrada' })
  async getUserActiveSubscription(@Param('userId') userId: string): Promise<UserSubscription | null> {
    return await this.paymentsService.getUserActiveSubscription(userId);
  }

  // Webhooks

  @Post('webhooks/stripe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook do Stripe' })
  @ApiResponse({ status: 200, description: 'Webhook processado com sucesso' })
  @ApiResponse({ status: 400, description: 'Assinatura do webhook inválida' })
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @RawBody() rawBody: Buffer,
  ): Promise<{ received: boolean }> {
    try {
      if (!signature) {
        throw new BadRequestException('Missing stripe-signature header');
      }

      const payload = rawBody.toString();
      const event = this.stripeService.constructWebhookEvent(payload, signature);

      this.logger.log(`Processing Stripe webhook: ${event.type}`);

      // Processar diferentes tipos de eventos
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handleStripePaymentSucceeded(event.data.object as any);
          break;
        case 'payment_intent.payment_failed':
          await this.handleStripePaymentFailed(event.data.object as any);
          break;
        case 'checkout.session.completed':
          await this.handleStripeCheckoutCompleted(event.data.object as any);
          break;
        default:
          this.logger.warn(`Unhandled Stripe event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error('Error processing Stripe webhook:', error);
      throw new BadRequestException('Error processing webhook');
    }
  }

  @Post('webhooks/paypal')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook do PayPal' })
  @ApiResponse({ status: 200, description: 'Webhook processado com sucesso' })
  @ApiResponse({ status: 400, description: 'Webhook inválido' })
  async handlePayPalWebhook(
    @Headers() headers: Record<string, string>,
    @Body() webhookData: PayPalWebhookDto,
  ): Promise<{ received: boolean }> {
    try {
      // Verificar se o webhook é válido
      const isValid = await this.paypalService.verifyWebhook(
        JSON.stringify(webhookData),
        headers,
      );

      if (!isValid) {
        throw new BadRequestException('Invalid PayPal webhook signature');
      }

      this.logger.log(`Processing PayPal webhook: ${webhookData.event_type}`);

      // Processar diferentes tipos de eventos
      switch (webhookData.event_type) {
        case 'CHECKOUT.ORDER.APPROVED':
          await this.handlePayPalOrderApproved(webhookData);
          break;
        case 'PAYMENT.CAPTURE.COMPLETED':
          await this.handlePayPalPaymentCompleted(webhookData);
          break;
        case 'PAYMENT.CAPTURE.DENIED':
          await this.handlePayPalPaymentFailed(webhookData);
          break;
        default:
          this.logger.warn(`Unhandled PayPal event type: ${webhookData.event_type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error('Error processing PayPal webhook:', error);
      throw new BadRequestException('Error processing webhook');
    }
  }

  // Métodos auxiliares para processamento de webhooks

  private async handleStripePaymentSucceeded(paymentIntent: any): Promise<void> {
    try {
      const paymentId = paymentIntent.metadata?.paymentId;
      if (paymentId) {
        await this.paymentsService.confirmPayment(paymentId, paymentIntent);
        this.logger.log(`Stripe payment confirmed: ${paymentId}`);
      }
    } catch (error) {
      this.logger.error('Error handling Stripe payment succeeded:', error);
    }
  }

  private async handleStripePaymentFailed(paymentIntent: any): Promise<void> {
    try {
      const paymentId = paymentIntent.metadata?.paymentId;
      if (paymentId) {
        const payment = await this.paymentsService.getPaymentById(paymentId);
        // Marcar como falhou seria implementado aqui
        this.logger.log(`Stripe payment failed: ${paymentId}`);
      }
    } catch (error) {
      this.logger.error('Error handling Stripe payment failed:', error);
    }
  }

  private async handleStripeCheckoutCompleted(session: any): Promise<void> {
    try {
      const paymentId = session.metadata?.paymentId;
      if (paymentId) {
        await this.paymentsService.confirmPayment(paymentId, session);
        this.logger.log(`Stripe checkout completed: ${paymentId}`);
      }
    } catch (error) {
      this.logger.error('Error handling Stripe checkout completed:', error);
    }
  }

  private async handlePayPalOrderApproved(webhookData: PayPalWebhookDto): Promise<void> {
    try {
      // Extrair informações do webhook e processar
      this.logger.log(`PayPal order approved: ${webhookData.resource?.id}`);
    } catch (error) {
      this.logger.error('Error handling PayPal order approved:', error);
    }
  }

  private async handlePayPalPaymentCompleted(webhookData: PayPalWebhookDto): Promise<void> {
    try {
      const orderId = webhookData.resource?.id;
      // Buscar pagamento pelo orderId e confirmar
      this.logger.log(`PayPal payment completed: ${orderId}`);
    } catch (error) {
      this.logger.error('Error handling PayPal payment completed:', error);
    }
  }

  private async handlePayPalPaymentFailed(webhookData: PayPalWebhookDto): Promise<void> {
    try {
      const orderId = webhookData.resource?.id;
      // Buscar pagamento pelo orderId e marcar como falhou
      this.logger.log(`PayPal payment failed: ${orderId}`);
    } catch (error) {
      this.logger.error('Error handling PayPal payment failed:', error);
    }
  }
}
