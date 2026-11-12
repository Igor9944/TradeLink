import { Injectable, BadRequestException } from '@nestjs/common';
import { CinetPayService } from './providers/cinetpay.service';
import { FedaPayService } from './providers/fedapay.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentStatus } from '@prisma/client';

export enum PaymentProvider {
  CINETPAY = 'CINETPAY',
  FEDAPAY = 'FEDAPAY',
  STRIPE = 'STRIPE',
}

interface CreatePaymentDto {
  orderId: string;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerCountry?: string;
  provider?: PaymentProvider; // Si non spécifié, auto-détecté
}

@Injectable()
export class PaymentGatewayService {
  constructor(
    private cinetpayService: CinetPayService,
    private fedapayService: FedaPayService,
    private prisma: PrismaService,
  ) {}

  /**
   * Sélectionner le provider de paiement optimal
   * selon la devise et le pays du client
   */
  selectProvider(currency: string, country?: string): PaymentProvider {
    // Devises CFA (Afrique de l'Ouest et Centrale) → CinetPay
    if (['XOF', 'XAF'].includes(currency)) {
      return PaymentProvider.CINETPAY;
    }

    // Pays spécifiques Togo/Bénin → FedaPay
    if (country && ['TG', 'BJ'].includes(country.toUpperCase())) {
      return PaymentProvider.FEDAPAY;
    }

    // Devises internationales → Stripe
    if (['EUR', 'USD', 'GBP'].includes(currency)) {
      return PaymentProvider.STRIPE;
    }

    // Par défaut, CinetPay pour l'Afrique
    return PaymentProvider.CINETPAY;
  }

  /**
   * Créer un paiement via le provider approprié
   */
  async createPayment(dto: CreatePaymentDto): Promise<{
    paymentUrl: string;
    provider: PaymentProvider;
    paymentId: string;
  }> {
    // Sélectionner le provider
    const provider = dto.provider || this.selectProvider(dto.currency, dto.customerCountry);

    // Vérifier que la commande existe
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new BadRequestException(`Commande ${dto.orderId} introuvable`);
    }

    let paymentUrl: string;
    let externalPaymentId: string;

    switch (provider) {
      case PaymentProvider.CINETPAY:
        const cinetpayResult = await this.cinetpayService.createPayment({
          amount: dto.amount,
          currency: dto.currency,
          transactionId: order.orderNumber,
          customerName: dto.customerName,
          customerEmail: dto.customerEmail,
          customerPhone: dto.customerPhone,
          description: `Paiement commande ${order.orderNumber}`,
        });
        paymentUrl = cinetpayResult.data.payment_url;
        externalPaymentId = cinetpayResult.data.payment_token;
        break;

      case PaymentProvider.FEDAPAY:
        const names = dto.customerName.split(' ');
        const fedapayResult = await this.fedapayService.createPayment({
          amount: dto.amount,
          currency: dto.currency,
          transactionId: order.orderNumber,
          customerFirstName: names[0] || dto.customerName,
          customerLastName: names.slice(1).join(' ') || names[0],
          customerEmail: dto.customerEmail,
          customerPhone: dto.customerPhone || '',
          customerCountry: dto.customerCountry?.toLowerCase() || 'tg',
          description: `Paiement commande ${order.orderNumber}`,
        });
        paymentUrl = fedapayResult.paymentUrl;
        externalPaymentId = fedapayResult.fedapayId.toString();
        break;

      case PaymentProvider.STRIPE:
        throw new BadRequestException(
          'Stripe requiert une facture. Créez une intention de paiement depuis une facture envoyée.',
        );

      default:
        throw new BadRequestException(`Provider ${provider} non supporté`);
    }

    // Créer le Payment dans la base
    const payment = await this.prisma.payment.create({
      data: {
        orderId: dto.orderId,
        amount: dto.amount,
        currency: dto.currency,
        provider,
        externalPaymentId,
        status: PaymentStatus.PENDING,
        metadata: {
          customerName: dto.customerName,
          customerEmail: dto.customerEmail,
          customerPhone: dto.customerPhone,
        },
      },
    });

    return {
      paymentUrl,
      provider,
      paymentId: payment.id,
    };
  }

  /**
   * Vérifier le statut d'un paiement
   */
  async checkPaymentStatus(paymentId: string): Promise<{
    status: string;
    amount: number;
    currency: string;
  }> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new BadRequestException('Paiement introuvable');
    }

    switch (payment.provider) {
      case PaymentProvider.CINETPAY:
        const cinetpayStatus = await this.cinetpayService.checkPaymentStatus(
          payment.externalPaymentId
        );
        return {
          status: cinetpayStatus.data.payment_status,
          amount: parseFloat(cinetpayStatus.data.amount),
          currency: cinetpayStatus.data.currency,
        };

      case PaymentProvider.FEDAPAY:
        const fedapayStatus = await this.fedapayService.getPaymentStatus(
          parseInt(payment.externalPaymentId)
        );
        return fedapayStatus;

      case PaymentProvider.STRIPE:
        // Utiliser le service Stripe existant
        // Déjà implémenté dans payments.service.ts
        return {
          status: payment.status,
          amount: payment.amount.toNumber(),
          currency: payment.currency,
        };

      default:
        throw new BadRequestException(`Provider ${payment.provider} non supporté`);
    }
  }
}
