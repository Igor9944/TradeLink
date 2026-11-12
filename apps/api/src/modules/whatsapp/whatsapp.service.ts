import { BadGatewayException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface SendWhatsAppDto {
  to: string;
  template: string;
  params: string[];
  lang?: 'fr' | 'en' | 'ar';
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly apiUrl = 'https://graph.facebook.com/v18.0';
  private readonly phoneId: string;
  private readonly accessToken: string;

  constructor(private configService: ConfigService) {
    this.phoneId = this.configService.get<string>('WHATSAPP_PHONE_ID');
    this.accessToken = this.configService.get<string>('WHATSAPP_ACCESS_TOKEN');

    if (!this.phoneId || !this.accessToken) {
      this.logger.warn('WhatsApp credentials not configured, service will not work');
    }
  }

  /**
   * Envoyer un message WhatsApp avec template
   */
  async sendMessage(dto: SendWhatsAppDto): Promise<{ messageId: string }> {
    this.assertConfigured();

    try {
      // Nettoyer le numéro de téléphone (retirer espaces, +, etc.)
      const cleanPhone = dto.to.replace(/[^\d]/g, '');

      this.logger.log(`Sending WhatsApp template ${dto.template}`);

      const response = await axios.post(
        `${this.apiUrl}/${this.phoneId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: cleanPhone,
          type: 'template',
          template: {
            name: dto.template,
            language: {
              code: this.getLanguageCode(dto.lang || 'fr'),
            },
            components: [
              {
                type: 'body',
                parameters: dto.params.map(param => ({
                  type: 'text',
                  text: param,
                })),
              },
            ],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const messageId = response.data.messages?.[0]?.id;
      if (!messageId) {
        throw new BadGatewayException('WhatsApp provider returned no message ID');
      }

      return { messageId };
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error;
      }
      this.logger.error(`Failed to send WhatsApp: ${error.message}`, error.response?.data);
      throw new BadGatewayException('WhatsApp provider failed to send the message');
    }
  }

  async sendTextMessage(to: string, message: string): Promise<{ messageId: string }> {
    this.assertConfigured();

    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: to.replace(/[^\d]/g, ''),
          type: 'text',
          text: { body: message },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );
      const messageId = response.data.messages?.[0]?.id;
      if (!messageId) {
        throw new BadGatewayException('WhatsApp provider returned no message ID');
      }
      return { messageId };
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error;
      }
      this.logger.error(`Failed to send WhatsApp text message: ${error.message}`);
      throw new BadGatewayException('WhatsApp provider failed to send the message');
    }
  }

  private assertConfigured(): void {
    if (!this.phoneId || !this.accessToken) {
      throw new ServiceUnavailableException('WhatsApp provider is not configured');
    }
  }

  /**
   * Envoyer une relance KYC
   */
  async sendKycReminder(
    phone: string,
    firstName: string,
    daysLeft: number,
    lang: 'fr' | 'en' | 'ar' = 'fr'
  ): Promise<void> {
    const kycUrl = `${this.configService.get('APP_URL')}/kyc`;
    
    await this.sendMessage({
      to: phone,
      template: 'kyc_reminder',
      params: [firstName, daysLeft.toString(), kycUrl],
      lang,
    });
  }

  /**
   * Envoyer une notification de commande confirmée
   */
  async sendOrderConfirmed(
    phone: string,
    firstName: string,
    orderNumber: string,
    amount: string,
    currency: string,
    deliveryDate: string,
    trackingUrl: string,
    lang: 'fr' | 'en' | 'ar' = 'fr'
  ): Promise<void> {
    await this.sendMessage({
      to: phone,
      template: 'order_confirmed',
      params: [firstName, orderNumber, amount, deliveryDate, trackingUrl],
      lang,
    });
  }

  /**
   * Envoyer une notification d'expédition
   */
  async sendShipmentUpdate(
    phone: string,
    firstName: string,
    orderNumber: string,
    status: string,
    trackingUrl: string,
    lang: 'fr' | 'en' | 'ar' = 'fr'
  ): Promise<void> {
    await this.sendMessage({
      to: phone,
      template: 'shipment_update',
      params: [firstName, orderNumber, status, trackingUrl],
      lang,
    });
  }

  /**
   * Envoyer une notification de livraison
   */
  async sendDelivered(
    phone: string,
    firstName: string,
    orderNumber: string,
    lang: 'fr' | 'en' | 'ar' = 'fr'
  ): Promise<void> {
    await this.sendMessage({
      to: phone,
      template: 'order_delivered',
      params: [firstName, orderNumber],
      lang,
    });
  }

  /**
   * Envoyer une notification de facture disponible
   */
  async sendInvoiceAvailable(
    phone: string,
    firstName: string,
    invoiceNumber: string,
    amount: string,
    currency: string,
    downloadUrl: string,
    lang: 'fr' | 'en' | 'ar' = 'fr'
  ): Promise<void> {
    await this.sendMessage({
      to: phone,
      template: 'invoice_available',
      params: [firstName, invoiceNumber, amount, downloadUrl],
      lang,
    });
  }

  /**
   * Envoyer une notification de paiement réussi
   */
  async sendPaymentSuccess(
    phone: string,
    firstName: string,
    amount: string,
    currency: string,
    invoiceNumber: string,
    lang: 'fr' | 'en' | 'ar' = 'fr'
  ): Promise<void> {
    await this.sendMessage({
      to: phone,
      template: 'payment_success',
      params: [firstName, amount, invoiceNumber],
      lang,
    });
  }

  /**
   * Convertir le code langue en format WhatsApp
   */
  private getLanguageCode(lang: 'fr' | 'en' | 'ar'): string {
    const mapping = {
      fr: 'fr',
      en: 'en',
      ar: 'ar',
    };
    return mapping[lang] || 'fr';
  }

  /**
   * Gérer un webhook WhatsApp entrant
   */
  async handleWebhook(payload: any): Promise<void> {
    try {
      this.logger.log(`WhatsApp webhook received: ${JSON.stringify(payload)}`);

      // Traiter les différents types d'événements
      if (payload.entry) {
        for (const entry of payload.entry) {
          if (entry.changes) {
            for (const change of entry.changes) {
              if (change.value.statuses) {
                // Statuts de livraison des messages
                for (const status of change.value.statuses) {
                  this.logger.log(
                    `Message ${status.id} status: ${status.status}`
                  );
                }
              }

              if (change.value.messages) {
                // Messages entrants (réponses utilisateurs)
                for (const message of change.value.messages) {
                  this.logger.log(
                    `Message from ${message.from}: ${message.text?.body || '[media]'}`
                  );
                  // Ici on pourrait créer automatiquement un ticket support
                }
              }
            }
          }
        }
      }
    } catch (error) {
      this.logger.error(`Failed to process WhatsApp webhook: ${error.message}`);
    }
  }

  /**
   * Vérifier un webhook WhatsApp (verification token)
   */
  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    const verifyToken = this.configService.get<string>('WHATSAPP_WEBHOOK_SECRET');

    if (mode === 'subscribe' && token === verifyToken) {
      this.logger.log('WhatsApp webhook verified successfully');
      return challenge;
    }

    this.logger.warn('WhatsApp webhook verification failed');
    return null;
  }
}
