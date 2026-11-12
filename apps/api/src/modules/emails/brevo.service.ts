import { BadGatewayException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface SendEmailDto {
  to: string;
  toName?: string;
  template: string;
  lang: 'fr' | 'en' | 'ar';
  params: Record<string, unknown>;
}

@Injectable()
export class BrevoService {
  private readonly logger = new Logger(BrevoService.name);
  private readonly apiKey: string;
  private readonly sender = {
    name: 'TradeLink',
    email: 'noreply@tradelink.com',
  };

  // Mapping des templates par type et langue
  private readonly templates = {
    'kyc-reminder-day-1': { fr: 1, en: 2, ar: 3 },
    'kyc-reminder-day-3': { fr: 4, en: 5, ar: 6 },
    'kyc-reminder-day-5': { fr: 7, en: 8, ar: 9 },
    'account-suspended-kyc': { fr: 10, en: 11, ar: 12 },
    'order-confirmed': { fr: 13, en: 14, ar: 15 },
    'invoice-available': { fr: 16, en: 17, ar: 18 },
    'shipment-update': { fr: 19, en: 20, ar: 21 },
    'ticket-created': { fr: 22, en: 23, ar: 24 },
    'ticket-resolved': { fr: 25, en: 26, ar: 27 },
    'payment-success': { fr: 28, en: 29, ar: 30 },
    'payment-failed': { fr: 31, en: 32, ar: 33 },
    'welcome': { fr: 34, en: 35, ar: 36 },
  };

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('BREVO_API_KEY');
    
    if (!this.apiKey) {
      this.logger.warn('[BrevoService] BREVO_API_KEY is not configured');
    }
  }

  /**
   * Tester la connexion à Brevo
   */
  async testConnection(): Promise<void> {
    if (!this.apiKey) {
      throw new ServiceUnavailableException('Email provider is not configured');
    }

    try {
      await axios.get('https://api.brevo.com/v3/account', {
        headers: { 'api-key': this.apiKey },
      });
    } catch (error) {
      this.logger.error(`Brevo connection test failed: ${error.message}`);
      throw new BadGatewayException('Email provider connection test failed');
    }
  }

  /**
   * Envoyer un email transactionnel via Brevo
   */
  async sendEmail(dto: SendEmailDto): Promise<{ messageId: string }> {
    if (!this.apiKey) {
      throw new ServiceUnavailableException('Email provider is not configured');
    }

    try {
      const templateId = this.getTemplateId(dto.template, dto.lang);

      if (!templateId) {
        throw new BadGatewayException(`Template ${dto.template} is not configured for language ${dto.lang}`);
      }

      const response = await axios.post<{ messageId?: string }>(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: this.sender,
          to: [{ email: dto.to, name: dto.toName }],
          templateId,
          params: dto.params,
        },
        {
          headers: {
            'api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
        },
      );
      if (!response.data.messageId) {
        throw new BadGatewayException('Email provider returned no message ID');
      }

      return { messageId: response.data.messageId };
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error;
      }
      this.logger.error(`Failed to send email: ${error.message}`);
      throw new BadGatewayException('Email provider failed to send the message');
    }
  }

  async sendOtpEmail(
    to: string,
    code: string,
    lang: 'fr' | 'en' | 'ar',
    expiresInMinutes: number,
  ): Promise<void> {
    if (!this.apiKey) {
      throw new ServiceUnavailableException('Email provider is not configured');
    }

    const copy = {
      fr: { subject: 'Votre code de vérification TradeLink', message: `Votre code est ${code}. Il expire dans ${expiresInMinutes} minutes.` },
      en: { subject: 'Your TradeLink verification code', message: `Your code is ${code}. It expires in ${expiresInMinutes} minutes.` },
      ar: { subject: 'رمز التحقق الخاص بك من TradeLink', message: `رمزك هو ${code}. تنتهي صلاحيته خلال ${expiresInMinutes} دقائق.` },
    }[lang];

    try {
      await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: this.sender,
          to: [{ email: to }],
          subject: copy.subject,
          textContent: copy.message,
        },
        {
          headers: {
            'api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
        },
      );
    } catch (error) {
      this.logger.error(`Failed to send verification email: ${error.message}`);
      throw new BadGatewayException('Email provider failed to send the verification code');
    }
  }

  /**
   * Envoyer un email de relance KYC
   */
  async sendKycReminder(to: string, firstName: string, daysLeft: number, lang: 'fr' | 'en' | 'ar') {
    const templateKey = daysLeft === 6 ? 'kyc-reminder-day-1' :
                        daysLeft === 4 ? 'kyc-reminder-day-3' :
                        daysLeft === 2 ? 'kyc-reminder-day-5' :
                        'kyc-reminder-day-1';

    return this.sendEmail({
      to,
      toName: firstName,
      template: templateKey,
      lang,
      params: {
        firstName,
        daysLeft,
        kycUrl: `${this.configService.get('APP_URL')}/kyc`,
      },
    });
  }

  /**
   * Envoyer un email de suspension de compte
   */
  async sendAccountSuspended(to: string, firstName: string, lang: 'fr' | 'en' | 'ar') {
    return this.sendEmail({
      to,
      toName: firstName,
      template: 'account-suspended-kyc',
      lang,
      params: {
        firstName,
        supportUrl: `${this.configService.get('APP_URL')}/support`,
      },
    });
  }

  /**
   * Envoyer un email de confirmation de commande
   */
  async sendOrderConfirmed(
    to: string,
    firstName: string,
    orderNumber: string,
    amount: string,
    currency: string,
    deliveryDate: string,
    lang: 'fr' | 'en' | 'ar'
  ) {
    return this.sendEmail({
      to,
      toName: firstName,
      template: 'order-confirmed',
      lang,
      params: {
        firstName,
        orderNumber,
        amount,
        currency,
        deliveryDate,
        trackingUrl: `${this.configService.get('APP_URL')}/orders/${orderNumber}`,
      },
    });
  }

  /**
   * Envoyer un email de facture disponible
   */
  async sendInvoiceAvailable(
    to: string,
    firstName: string,
    invoiceNumber: string,
    amount: string,
    currency: string,
    dueDate: string,
    lang: 'fr' | 'en' | 'ar'
  ) {
    return this.sendEmail({
      to,
      toName: firstName,
      template: 'invoice-available',
      lang,
      params: {
        firstName,
        invoiceNumber,
        amount,
        currency,
        dueDate,
        invoiceUrl: `${this.configService.get('APP_URL')}/invoices/${invoiceNumber}`,
      },
    });
  }

  /**
   * Envoyer un email de mise à jour d'expédition
   */
  async sendShipmentUpdate(
    to: string,
    firstName: string,
    trackingNumber: string,
    status: string,
    estimatedDelivery: string,
    lang: 'fr' | 'en' | 'ar'
  ) {
    return this.sendEmail({
      to,
      toName: firstName,
      template: 'shipment-update',
      lang,
      params: {
        firstName,
        trackingNumber,
        status,
        estimatedDelivery,
        trackingUrl: `${this.configService.get('APP_URL')}/shipments/${trackingNumber}`,
      },
    });
  }

  /**
   * Récupérer l'ID du template selon le type et la langue
   */
  private getTemplateId(template: string, lang: 'fr' | 'en' | 'ar'): number | null {
    const templateMapping = this.templates[template];
    if (!templateMapping) return null;
    return templateMapping[lang] || null;
  }
}
