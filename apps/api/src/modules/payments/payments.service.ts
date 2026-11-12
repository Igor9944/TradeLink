import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PaginationDto,
  getPaginationParams,
  buildPaginatedResponse,
} from '../../common/dto/pagination.dto';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { InvoiceStatus, PaymentStatus, Prisma, Role } from '@prisma/client';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    const stripeSecretKey = this.config.get<string>('STRIPE_SECRET_KEY');
    
    if (!stripeSecretKey) {
      this.logger.warn('STRIPE_SECRET_KEY not configured - payments will not work');
      return;
    }

    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });
    
    this.logger.log('✅ Stripe SDK initialized');
  }

  /**
   * Créer un PaymentIntent Stripe pour une facture
   */
  async createPaymentIntent(dto: CreatePaymentIntentDto, userId: string, userRole: Role) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    // Vérifier que la facture existe
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: dto.invoiceId },
      include: {
        order: {
          include: {
            client: { select: { id: true, email: true } },
          },
        },
        payments: {
          where: { status: PaymentStatus.SUCCEEDED },
          select: { amount: true },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Facture introuvable');
    }
    this.assertInvoiceAccess(invoice.order, userId, userRole);

    // Vérifier que la facture n'est pas déjà payée
    if (invoice.status !== InvoiceStatus.SENT && invoice.status !== InvoiceStatus.OVERDUE) {
      throw new BadRequestException('Seules les factures envoyées ou échues peuvent être payées');
    }

    if (dto.currency.toUpperCase() !== invoice.currency.toUpperCase()) {
      throw new BadRequestException('La devise du paiement doit correspondre à celle de la facture');
    }

    const paidAmount = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const outstandingAmount = Number(invoice.totalTTC) - paidAmount;
    const scale = this.currencyScale(invoice.currency);
    if (
      Math.round(dto.amount * scale) !== Math.round(outstandingAmount * scale) ||
      outstandingAmount <= 0
    ) {
      throw new BadRequestException('Le montant doit correspondre au solde exact de la facture');
    }

    try {
      // Créer le PaymentIntent Stripe
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(dto.amount * scale),
        currency: dto.currency.toLowerCase(),
        metadata: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          orderId: invoice.orderId,
          clientEmail: invoice.order.client.email || 'N/A',
        },
        description: `Payment for invoice ${invoice.invoiceNumber}`,
      });

      // Enregistrer le paiement en base de données
      const payment = await this.prisma.payment.create({
        data: {
          invoiceId: dto.invoiceId,
          stripePaymentIntentId: paymentIntent.id,
          amount: dto.amount,
          currency: dto.currency,
          status: PaymentStatus.PENDING,
        },
      });

      this.logger.log(
        `Payment Intent created: ${paymentIntent.id} for invoice ${invoice.invoiceNumber}`,
      );

      return {
        paymentId: payment.id,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: dto.amount,
        currency: dto.currency,
      };
    } catch (error) {
      this.logger.error('Failed to create Stripe PaymentIntent', error);
      throw new BadRequestException(
        `Stripe error: ${error.message || 'Unknown error'}`,
      );
    }
  }

  /**
   * Webhook Stripe : gestion des événements
   */
  async handleStripeWebhook(signature: string, rawBody: Buffer) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new BadRequestException('STRIPE_WEBHOOK_SECRET not configured');
    }

    let event: Stripe.Event;

    try {
      // Vérifier la signature du webhook
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    this.logger.log(`Received Stripe event: ${event.type}`);

    // Traiter l'événement selon son type
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.succeeded':
        await this.handleChargeSucceeded(event.data.object as Stripe.Charge);
        break;

      case 'charge.refunded':
        await this.handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  /**
   * Paiement réussi
   */
  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    const payment = await this.prisma.payment.findUnique({
      where: { stripePaymentIntentId: paymentIntent.id },
      include: { invoice: true },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for PI: ${paymentIntent.id}`);
      return;
    }

    // Mettre à jour le paiement
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.SUCCEEDED,
        paidAt: new Date(),
      },
    });

    // Mettre à jour la facture
    await this.prisma.invoice.update({
      where: { id: payment.invoiceId },
      data: {
        status: InvoiceStatus.PAID,
        paidAt: new Date(),
      },
    });

    this.logger.log(
      `Payment succeeded: ${payment.id} for invoice ${payment.invoice.invoiceNumber}`,
    );

    // TODO: Envoyer une notification au client
  }

  /**
   * Paiement échoué
   */
  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    const payment = await this.prisma.payment.findUnique({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for PI: ${paymentIntent.id}`);
      return;
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.FAILED,
        failureReason: paymentIntent.last_payment_error?.message || 'Unknown error',
      },
    });

    this.logger.warn(`Payment failed: ${payment.id}`);
  }

  /**
   * Charge réussie (confirmation finale)
   */
  private async handleChargeSucceeded(charge: Stripe.Charge) {
    if (!charge.payment_intent) return;

    const payment = await this.prisma.payment.findUnique({
      where: { stripePaymentIntentId: charge.payment_intent as string },
    });

    if (!payment) return;

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        stripeChargeId: charge.id,
      },
    });

    this.logger.log(`Charge succeeded: ${charge.id}`);
  }

  /**
   * Remboursement
   */
  private async handleChargeRefunded(charge: Stripe.Charge) {
    const payment = await this.prisma.payment.findUnique({
      where: { stripeChargeId: charge.id },
      include: { invoice: true },
    });

    if (!payment) return;

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.REFUNDED,
      },
    });

    // Mettre à jour la facture
    await this.prisma.invoice.update({
      where: { id: payment.invoiceId },
      data: {
        status: InvoiceStatus.CANCELLED,
      },
    });

    this.logger.log(
      `Payment refunded: ${payment.id} for invoice ${payment.invoice.invoiceNumber}`,
    );
  }

  /**
   * Lister les paiements accessibles à l'utilisateur connecté
   */
  async findAll(userId: string, userRole: Role, pagination: PaginationDto) {
    const { skip, take } = getPaginationParams(pagination);
    const where: Prisma.PaymentWhereInput = {};

    if (userRole === Role.CLIENT) {
      where.OR = [
        { invoice: { is: { order: { clientId: userId } } } },
        { order: { is: { clientId: userId } } },
      ];
    } else if (userRole === Role.SUPPLIER) {
      where.OR = [
        { invoice: { is: { order: { supplierId: userId } } } },
        { order: { is: { supplierId: userId } } },
      ];
    } else if (userRole !== Role.ADMIN) {
      throw new ForbiddenException('Accès refusé');
    }

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take,
        include: {
          invoice: { select: { invoiceNumber: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return buildPaginatedResponse(data, total, pagination);
  }

  /**
   * Obtenir un paiement par ID
   */
  async findById(id: string, userId: string, userRole: Role) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        invoice: {
          include: {
            order: {
              include: {
                client: { select: { id: true, email: true } },
              },
            },
          },
        },
        order: { select: { clientId: true, supplierId: true } },
      },
    });

    if (!payment) {
      throw new NotFoundException('Paiement introuvable');
    }
    this.assertPaymentAccess(payment, userId, userRole);

    return payment;
  }

  /**
   * Liste des paiements pour une facture
   */
  async findByInvoice(invoiceId: string, userId: string, userRole: Role) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { order: true },
    });
    if (!invoice) throw new NotFoundException('Facture introuvable');
    this.assertInvoiceAccess(invoice.order, userId, userRole);

    return this.prisma.payment.findMany({
      where: { invoiceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  private assertInvoiceAccess(
    order: { clientId: string; supplierId: string },
    userId: string,
    userRole: Role,
  ) {
    if (
      userRole !== Role.ADMIN &&
      !(
        (userRole === Role.CLIENT && order.clientId === userId) ||
        (userRole === Role.SUPPLIER && order.supplierId === userId)
      )
    ) {
      throw new NotFoundException('Facture introuvable');
    }
  }

  private assertPaymentAccess(
    payment: {
      invoice: { order: { clientId: string; supplierId: string } } | null;
      order: { clientId: string; supplierId: string } | null;
    },
    userId: string,
    userRole: Role,
  ) {
    const order = payment.invoice?.order ?? payment.order;
    if (!order) throw new NotFoundException('Paiement introuvable');
    this.assertInvoiceAccess(order, userId, userRole);
  }

  private currencyScale(currency: string): number {
    return currency.toUpperCase() === 'TND' ? 1000 : 100;
  }
}
