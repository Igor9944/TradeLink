import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

interface CinetPayPaymentRequest {
  amount: number;
  currency: string;
  transactionId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  description?: string;
}

interface CinetPayPaymentResponse {
  code: string;
  message: string;
  data: {
    payment_url: string;
    payment_token: string;
  };
}

@Injectable()
export class CinetPayService {
  private readonly logger = new Logger(CinetPayService.name);
  private readonly apiUrl = 'https://api-checkout.cinetpay.com/v2/payment';
  private readonly apiKey: string;
  private readonly siteId: string;
  private readonly notifyUrl: string;
  private readonly returnUrl: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('CINETPAY_API_KEY');
    this.siteId = this.configService.get<string>('CINETPAY_SITE_ID');
    this.notifyUrl = this.configService.get<string>('CINETPAY_NOTIFY_URL') || 
      `${this.configService.get('API_URL')}/webhooks/cinetpay`;
    this.returnUrl = this.configService.get<string>('CINETPAY_RETURN_URL') || 
      `${this.configService.get('APP_URL')}/payment/success`;
  }

  /**
   * Créer un paiement CinetPay
   * Retourne l'URL de paiement pour rediriger le client
   */
  async createPayment(request: CinetPayPaymentRequest): Promise<CinetPayPaymentResponse> {
    try {
      const payload = {
        apikey: this.apiKey,
        site_id: this.siteId,
        transaction_id: request.transactionId,
        amount: request.amount,
        currency: request.currency,
        description: request.description || `Paiement commande ${request.transactionId}`,
        customer_name: request.customerName,
        customer_surname: request.customerName.split(' ')[0] || '',
        customer_email: request.customerEmail,
        customer_phone_number: request.customerPhone || '',
        notify_url: this.notifyUrl,
        return_url: this.returnUrl,
        channels: 'ALL', // Mobile Money + Cartes
        metadata: JSON.stringify({
          orderId: request.transactionId,
        }),
      };

      this.logger.log(`Creating CinetPay payment for ${request.transactionId}`);

      const response = await axios.post<CinetPayPaymentResponse>(
        this.apiUrl,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.code !== '201') {
        throw new Error(`CinetPay error: ${response.data.message}`);
      }

      this.logger.log(`CinetPay payment created: ${response.data.data.payment_token}`);

      return response.data;
    } catch (error) {
      this.logger.error(`CinetPay payment creation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Vérifier le statut d'une transaction
   */
  async checkPaymentStatus(transactionId: string): Promise<any> {
    try {
      const payload = {
        apikey: this.apiKey,
        site_id: this.siteId,
        transaction_id: transactionId,
      };

      const response = await axios.post(
        'https://api-checkout.cinetpay.com/v2/payment/check',
        payload
      );

      return response.data;
    } catch (error) {
      this.logger.error(`CinetPay status check failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Valider la signature du webhook CinetPay
   */
  validateWebhookSignature(payload: any): boolean {
    // CinetPay ne fournit pas de signature HMAC par défaut
    // Validation par vérification de l'API Key dans le payload
    return payload.apikey === this.apiKey && payload.site_id === this.siteId;
  }

  /**
   * Traiter un webhook CinetPay
   * Webhook appelé après un paiement réussi
   */
  async handleWebhook(payload: any): Promise<{
    transactionId: string;
    status: 'ACCEPTED' | 'REFUSED' | 'PENDING';
    amount: number;
    currency: string;
  }> {
    this.logger.log(`Processing CinetPay webhook for ${payload.cpm_trans_id}`);

    // Statuts CinetPay: ACCEPTED, REFUSED, PENDING
    const status = payload.cpm_result === '00' ? 'ACCEPTED' : 
                   payload.cpm_result === '01' ? 'PENDING' : 'REFUSED';

    return {
      transactionId: payload.cpm_trans_id,
      status,
      amount: parseFloat(payload.cpm_amount),
      currency: payload.cpm_currency,
    };
  }
}
