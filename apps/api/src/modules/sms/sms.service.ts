import { BadGatewayException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AfricasTalking from 'africastalking';

interface SendSmsDto {
  to: string | string[];
  message: string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly sms: any = null;
  private readonly from: string = 'TradeLink';

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('AFRICASTALKING_API_KEY');
    const username = this.configService.get<string>('AFRICASTALKING_USERNAME');

    if (!apiKey || !username) {
      this.logger.warn('Africa\'s Talking credentials not configured, SMS service will not work');
      return;
    }

    const africasTalking = AfricasTalking({
      apiKey,
      username,
    });

    this.sms = africasTalking.SMS;
  }

  /**
   * Envoyer un SMS
   */
  async sendSMS(dto: SendSmsDto): Promise<{ messageId: string; status: string }> {
    if (!this.sms) {
      throw new ServiceUnavailableException('SMS provider is not configured');
    }

    try {
      const recipients = Array.isArray(dto.to) ? dto.to : [dto.to];

      this.logger.log(`Sending SMS to ${recipients.length} recipient(s)`);

      const response = await this.sms.send({
        to: recipients,
        message: dto.message,
        from: this.from,
      });

      const recipient = response.SMSMessageData.Recipients[0];
      if (!recipient?.messageId) {
        throw new BadGatewayException('SMS provider returned no message ID');
      }

      return {
        messageId: recipient.messageId,
        status: recipient.status || 'unknown',
      };
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error;
      }
      this.logger.error(`Failed to send SMS: ${error.message}`, error.stack);
      throw new BadGatewayException('SMS provider failed to send the message');
    }
  }

  /**
   * Envoyer un code OTP
   */
  async sendOTP(
    phone: string,
    code: string,
    lang: 'fr' | 'en' | 'ar',
    expiresInMinutes = 10,
  ): Promise<void> {
    const messages = {
      fr: `TradeLink: Votre code de vérification est ${code}. Valide ${expiresInMinutes} minutes.`,
      en: `TradeLink: Your verification code is ${code}. Valid for ${expiresInMinutes} minutes.`,
      ar: `TradeLink: رمز التحقق الخاص بك هو ${code}. صالح لمدة ${expiresInMinutes} دقائق.`,
    };

    await this.sendSMS({
      to: phone,
      message: messages[lang],
    });
  }

  /**
   * Envoyer une relance KYC
   */
  async sendKycReminder(phone: string, daysLeft: number, lang: 'fr' | 'en' | 'ar'): Promise<void> {
    const messages = {
      fr: `TradeLink: Il vous reste ${daysLeft} jours pour soumettre vos documents KYC. https://tradelink.com/kyc`,
      en: `TradeLink: You have ${daysLeft} days left to submit your KYC documents. https://tradelink.com/kyc`,
      ar: `TradeLink: لديك ${daysLeft} أيام متبقية لتقديم وثائق KYC. https://tradelink.com/kyc`,
    };

    await this.sendSMS({
      to: phone,
      message: messages[lang],
    });
  }

  /**
   * Envoyer une notification de commande confirmée
   */
  async sendOrderConfirmed(
    phone: string,
    orderNumber: string,
    amount: string,
    lang: 'fr' | 'en' | 'ar'
  ): Promise<void> {
    const messages = {
      fr: `TradeLink: Votre commande ${orderNumber} a été confirmée ! Montant: ${amount}. Suivez-la sur tradelink.com`,
      en: `TradeLink: Your order ${orderNumber} has been confirmed! Amount: ${amount}. Track it on tradelink.com`,
      ar: `TradeLink: تم تأكيد طلبك ${orderNumber}! المبلغ: ${amount}. تتبعه على tradelink.com`,
    };

    await this.sendSMS({
      to: phone,
      message: messages[lang],
    });
  }

  /**
   * Envoyer une notification de mise à jour d'expédition
   */
  async sendShipmentUpdate(
    phone: string,
    orderNumber: string,
    status: string,
    lang: 'fr' | 'en' | 'ar'
  ): Promise<void> {
    const statusLabels = {
      SHIPPED: { fr: 'expédiée', en: 'shipped', ar: 'تم الشحن' },
      DELIVERED: { fr: 'livrée', en: 'delivered', ar: 'تم التسليم' },
    };

    const label = statusLabels[status]?.[lang] || status;

    const messages = {
      fr: `TradeLink: Votre commande ${orderNumber} est ${label}. https://tradelink.com/orders/${orderNumber}`,
      en: `TradeLink: Your order ${orderNumber} is ${label}. https://tradelink.com/orders/${orderNumber}`,
      ar: `TradeLink: طلبك ${orderNumber} ${label}. https://tradelink.com/orders/${orderNumber}`,
    };

    await this.sendSMS({
      to: phone,
      message: messages[lang],
    });
  }

  /**
   * Envoyer une notification de suspension de compte
   */
  async sendAccountSuspended(phone: string, lang: 'fr' | 'en' | 'ar'): Promise<void> {
    const messages = {
      fr: `TradeLink: Votre compte a été suspendu pour non-soumission KYC. Contactez le support: support@tradelink.com`,
      en: `TradeLink: Your account has been suspended for KYC non-submission. Contact support: support@tradelink.com`,
      ar: `TradeLink: تم تعليق حسابك لعدم تقديم KYC. اتصل بالدعم: support@tradelink.com`,
    };

    await this.sendSMS({
      to: phone,
      message: messages[lang],
    });
  }

  /**
   * Tester la connexion Africa's Talking
   */
  async testConnection(): Promise<boolean> {
    return this.sms !== null;
  }
}
