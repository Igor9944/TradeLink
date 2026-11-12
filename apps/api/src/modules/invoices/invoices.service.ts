import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PaginationDto,
  getPaginationParams,
  buildPaginatedResponse,
} from '../../common/dto/pagination.dto';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoiceStatus, Role, OrderStatus, Prisma } from '@prisma/client';
import { PdfService } from './pdf.service';
import { readFile } from 'fs/promises';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    private prisma: PrismaService,
    private pdfService: PdfService,
  ) {}

  /**
   * Créer une facture à partir d'une commande
   */
  async create(dto: CreateInvoiceDto, userId: string, userRole: Role) {
    // Vérifier que la commande existe et est confirmée/livrée
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: {
        items: {
          include: {
            product: {
              select: { sku: true, name: true },
            },
          },
        },
        client: { select: { email: true, displayName: true } },
        supplier: { select: { email: true, displayName: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Commande introuvable');
    }
    if (userRole !== Role.ADMIN && (userRole !== Role.SUPPLIER || order.supplierId !== userId)) {
      throw new NotFoundException('Commande introuvable');
    }

    if (
      order.status !== OrderStatus.CONFIRMED &&
      order.status !== OrderStatus.IN_PREPARATION &&
      order.status !== OrderStatus.SHIPPED &&
      order.status !== OrderStatus.DELIVERED
    ) {
      throw new BadRequestException(
        'Impossible de créer une facture : la commande doit être confirmée',
      );
    }

    // Vérifier qu'une facture n'existe pas déjà
    const existingInvoice = await this.prisma.invoice.findFirst({
      where: { orderId: dto.orderId },
    });

    if (existingInvoice) {
      throw new BadRequestException(
        `Une facture existe déjà pour cette commande : ${existingInvoice.invoiceNumber}`,
      );
    }

    // Générer le numéro de facture
    const invoiceNumber = await this.generateInvoiceNumber();

    // Calculer la date d'échéance (30 jours par défaut)
    const dueDate = dto.dueDate
      ? new Date(dto.dueDate)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Créer la facture
    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber,
        orderId: order.id,
        status: InvoiceStatus.DRAFT,
        issuedAt: new Date(),
        dueDate,
        totalHT: order.totalHT,
        totalTax: order.totalTax,
        totalTTC: order.totalTTC,
        currency: order.currency,
      },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: {
                  select: { sku: true, name: true, images: { take: 1 } },
                },
              },
            },
            client: { select: { id: true, email: true, displayName: true } },
            supplier: { select: { id: true, email: true, displayName: true } },
          },
        },
      },
    });

    this.logger.log(
      `Invoice created: ${invoice.id} (${invoice.invoiceNumber}) for order ${order.orderNumber}`,
    );

    return invoice;
  }

  /**
   * Liste des factures avec filtres
   */
  async findAll(
    userId: string,
    userRole: Role,
    pagination: PaginationDto,
    filters?: { status?: InvoiceStatus; orderId?: string },
  ) {
    const { skip, take } = getPaginationParams(pagination);

    const where: Prisma.InvoiceWhereInput = {};

    // Filtrer par utilisateur selon le rôle
    if (userRole === Role.CLIENT) {
      where.order = { clientId: userId };
    } else if (userRole === Role.SUPPLIER) {
      where.order = { supplierId: userId };
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.orderId) {
      where.orderId = filters.orderId;
    }

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        skip,
        take,
        where,
        include: {
          order: {
            select: {
              orderNumber: true,
              client: { select: { email: true, displayName: true } },
              supplier: { select: { email: true, displayName: true } },
            },
          },
          _count: { select: { payments: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return buildPaginatedResponse(data, total, pagination);
  }

  /**
   * Obtenir une facture par ID
   */
  async findById(id: string, userId: string, userRole: Role) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: {
                  select: { sku: true, name: true, unit: true },
                },
              },
            },
            client: {
              select: {
                id: true,
                email: true,
                phone: true,
                displayName: true,
              },
            },
            supplier: {
              select: {
                id: true,
                email: true,
                phone: true,
                displayName: true,
              },
            },
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Facture introuvable');
    }
    this.assertInvoiceAccess(invoice.order, userId, userRole);

    return invoice;
  }

  /**
   * Marquer une facture comme envoyée
   */
  async markAsSent(id: string, userId: string, userRole: Role) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!invoice) {
      throw new NotFoundException('Facture introuvable');
    }
    this.assertInvoiceAccess(invoice.order, userId, userRole);

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException(
        'Seules les factures en brouillon peuvent être envoyées',
      );
    }

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.SENT,
        issuedAt: new Date(),
      },
    });

    this.logger.log(`Invoice sent: ${updated.invoiceNumber}`);

    // TODO: Envoyer l'email avec la facture PDF au client

    return updated;
  }

  /**
   * Générer le PDF d'une facture
   */
  async generatePdf(id: string, userId: string, userRole: Role): Promise<Buffer> {
    const invoice = await this.findById(id, userId, userRole);
    const filePath = await this.pdfService.generateInvoicePDF({
      invoiceNumber: invoice.invoiceNumber,
      date: invoice.issuedAt ?? invoice.createdAt,
      dueDate: invoice.dueDate ?? invoice.createdAt,
      supplier: {
        name: this.displayName(invoice.order.supplier.displayName),
        email: invoice.order.supplier.email ?? '',
        phone: invoice.order.supplier.phone ?? undefined,
      },
      client: {
        name: this.displayName(invoice.order.client.displayName),
        email: invoice.order.client.email ?? '',
        phone: invoice.order.client.phone ?? undefined,
      },
      items: invoice.order.items.map((item) => ({
        productName: this.displayName(item.productNameSnapshot),
        quantity: item.quantity,
        priceHT: Number(item.unitPriceHT),
        totalHT: Number(item.totalHT),
      })),
      totalHT: Number(invoice.totalHT),
      totalTax: Number(invoice.totalTax),
      totalTTC: Number(invoice.totalTTC),
      currency: invoice.currency,
      lang: 'fr',
    });
    return readFile(filePath);
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

  private displayName(value: Prisma.JsonValue | null): string {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const translations = value as Prisma.JsonObject;
      const name = translations.fr ?? translations.en ?? translations.ar;
      if (typeof name === 'string') return name;
    }
    return '';
  }

  /**
   * Générer un numéro de facture unique
   */
  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `FAC-${year}-`;

    // Compter les factures de cette année
    const count = await this.prisma.invoice.count({
      where: {
        invoiceNumber: { startsWith: prefix },
      },
    });

    const sequence = (count + 1).toString().padStart(5, '0');
    return `${prefix}${sequence}`;
  }

  /**
   * Obtenir les statistiques des factures
   */
  async getStats(userId: string, userRole: Role) {
    const where: Prisma.InvoiceWhereInput = {};

    if (userRole === Role.CLIENT) {
      where.order = { clientId: userId };
    } else if (userRole === Role.SUPPLIER) {
      where.order = { supplierId: userId };
    }

    const [total, draft, sent, paid, overdue, totalAmount, paidAmount] =
      await Promise.all([
        this.prisma.invoice.count({ where }),
        this.prisma.invoice.count({
          where: { ...where, status: InvoiceStatus.DRAFT },
        }),
        this.prisma.invoice.count({
          where: { ...where, status: InvoiceStatus.SENT },
        }),
        this.prisma.invoice.count({
          where: { ...where, status: InvoiceStatus.PAID },
        }),
        this.prisma.invoice.count({
          where: { ...where, status: InvoiceStatus.OVERDUE },
        }),
        this.prisma.invoice.aggregate({
          where,
          _sum: { totalTTC: true },
        }),
        this.prisma.invoice.aggregate({
          where: { ...where, status: InvoiceStatus.PAID },
          _sum: { totalTTC: true },
        }),
      ]);

    return {
      total,
      byStatus: {
        draft,
        sent,
        paid,
        overdue,
      },
      totalAmount: totalAmount._sum.totalTTC || 0,
      paidAmount: paidAmount._sum.totalTTC || 0,
      unpaidAmount: Number(totalAmount._sum.totalTTC || 0) - Number(paidAmount._sum.totalTTC || 0),
    };
  }
}
