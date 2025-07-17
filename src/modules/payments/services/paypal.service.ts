import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PayPalService {
  private readonly logger = new Logger(PayPalService.name);

  constructor(private readonly configService: ConfigService) {
    const clientId = this.configService.get<string>('PAYPAL_CLIENT_ID');
    const clientSecret = this.configService.get<string>('PAYPAL_CLIENT_SECRET');
    const environment = this.configService.get<string>(
      'PAYPAL_ENVIRONMENT',
      'sandbox',
    );

    if (!clientId || !clientSecret) {
      this.logger.error('PayPal configuration is missing');
      throw new Error('PayPal configuration is missing');
    }

    this.logger.log(`PayPal service initialized in ${environment} mode`);
  }

  /**
   * Cria uma ordem no PayPal (implementação simplificada)
   */
  async createOrder(data: {
    amount: number;
    currency?: string;
    returnUrl: string;
    cancelUrl: string;
    description?: string;
    metadata?: Record<string, string>;
  }): Promise<any> {
    try {
      this.logger.log(
        `Creating PayPal order for amount: ${data.amount} ${data.currency || 'BRL'}`,
      );

      // Implementação simplificada - em produção você implementaria a chamada real à API do PayPal
      const mockOrder = {
        id: `PAYPAL_ORDER_${Date.now()}`,
        status: 'CREATED',
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: data.currency?.toUpperCase() || 'BRL',
              value: data.amount.toFixed(2),
            },
            description: data.description || 'NeuralContent - Pagamento',
          },
        ],
        links: [
          {
            href: `${data.returnUrl}?token=MOCK_TOKEN`,
            rel: 'approve',
            method: 'GET',
          },
          {
            href: data.cancelUrl,
            rel: 'cancel',
            method: 'GET',
          },
        ],
      };

      this.logger.log(`PayPal order created successfully: ${mockOrder.id}`);
      return mockOrder;
    } catch (error) {
      this.logger.error('Error creating PayPal order:', error);
      throw new BadRequestException('Failed to create PayPal order');
    }
  }

  /**
   * Captura uma ordem já aprovada (implementação simplificada)
   */
  async captureOrder(orderId: string): Promise<any> {
    try {
      this.logger.log(`Capturing PayPal order: ${orderId}`);

      // Implementação simplificada
      const mockCaptureResult = {
        id: orderId,
        status: 'COMPLETED',
        purchase_units: [
          {
            payments: {
              captures: [
                {
                  id: `CAPTURE_${Date.now()}`,
                  status: 'COMPLETED',
                  amount: {
                    currency_code: 'BRL',
                    value: '29.90',
                  },
                },
              ],
            },
          },
        ],
      };

      this.logger.log(`PayPal order captured successfully: ${orderId}`);
      return mockCaptureResult;
    } catch (error) {
      this.logger.error(`Error capturing PayPal order ${orderId}:`, error);
      throw new BadRequestException('Failed to capture PayPal order');
    }
  }

  /**
   * Recupera detalhes de uma ordem (implementação simplificada)
   */
  async getOrder(orderId: string): Promise<any> {
    try {
      this.logger.log(`Retrieving PayPal order: ${orderId}`);

      // Implementação simplificada
      const mockOrder = {
        id: orderId,
        status: 'APPROVED',
      };

      return mockOrder;
    } catch (error) {
      this.logger.error(`Error retrieving PayPal order ${orderId}:`, error);
      throw new BadRequestException('Failed to retrieve PayPal order');
    }
  }

  /**
   * Cria uma assinatura (implementação simplificada)
   */
  async createSubscription(data: {
    planId: string;
    returnUrl: string;
    cancelUrl: string;
    subscriberInfo?: {
      name?: string;
      email?: string;
    };
    metadata?: Record<string, string>;
  }): Promise<any> {
    try {
      this.logger.log(`Creating PayPal subscription for plan: ${data.planId}`);

      // Implementação simplificada
      const mockSubscription = {
        id: 'sub_' + Date.now(),
        status: 'APPROVAL_PENDING',
        links: [
          {
            href: `${data.returnUrl}?subscription_id=sub_${Date.now()}`,
            rel: 'approve',
            method: 'GET',
          },
        ],
      };

      return mockSubscription;
    } catch (error) {
      this.logger.error('Error creating PayPal subscription:', error);
      throw new BadRequestException('Failed to create PayPal subscription');
    }
  }

  /**
   * Processa um reembolso (implementação simplificada)
   */
  async createRefund(
    captureId: string,
    amount?: number,
    currency?: string,
    note?: string,
  ): Promise<any> {
    try {
      this.logger.log(`Creating PayPal refund for capture: ${captureId}`);

      // Implementação simplificada
      const mockRefund = {
        id: 'refund_' + Date.now(),
        status: 'COMPLETED',
        amount: amount
          ? {
              value: amount.toFixed(2),
              currency_code: currency?.toUpperCase() || 'BRL',
            }
          : undefined,
      };

      this.logger.log(`PayPal refund created for capture: ${captureId}`);
      return mockRefund;
    } catch (error) {
      this.logger.error(
        `Error creating PayPal refund for ${captureId}:`,
        error,
      );
      throw new BadRequestException('Failed to create PayPal refund');
    }
  }

  /**
   * Verifica se um webhook é válido (implementação simplificada)
   */
  async verifyWebhook(
    payload: string,
    headers: Record<string, string>,
  ): Promise<boolean> {
    try {
      const webhookId = this.configService.get<string>('PAYPAL_WEBHOOK_ID');

      if (!webhookId) {
        this.logger.warn('PayPal webhook ID not configured');
        return false;
      }

      // Por enquanto, retorna true para desenvolvimento
      // Em produção, implemente a verificação real
      this.logger.log('PayPal webhook verification (development mode)');
      return true;
    } catch (error) {
      this.logger.error('Error verifying PayPal webhook:', error);
      return false;
    }
  }

  /**
   * Formata valor para exibição
   */
  formatAmount(amount: number, currency: string = 'BRL'): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  }

  /**
   * Converte status do PayPal para status interno
   */
  mapPayPalStatus(paypalStatus: string): string {
    const statusMap: Record<string, string> = {
      CREATED: 'pending',
      SAVED: 'pending',
      APPROVED: 'processing',
      VOIDED: 'cancelled',
      COMPLETED: 'completed',
      PAYER_ACTION_REQUIRED: 'pending',
    };

    return statusMap[paypalStatus] || 'pending';
  }

  /**
   * Extrai URLs de aprovação dos links do PayPal
   */
  extractApprovalUrl(links: any[]): string | null {
    const approvalLink = links?.find((link) => link.rel === 'approve');
    return approvalLink?.href || null;
  }

  /**
   * Extrai informações de captura da resposta do PayPal
   */
  extractCaptureInfo(orderResponse: any): {
    captureId: string;
    amount: number;
    currency: string;
    status: string;
  } | null {
    try {
      const purchaseUnit = orderResponse.purchase_units?.[0];
      const capture = purchaseUnit?.payments?.captures?.[0];

      if (!capture) {
        return null;
      }

      return {
        captureId: capture.id,
        amount: parseFloat(capture.amount.value),
        currency: capture.amount.currency_code,
        status: capture.status,
      };
    } catch (error) {
      this.logger.error('Error extracting capture info:', error);
      return null;
    }
  }
}
