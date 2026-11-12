import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PaginationDto,
  getPaginationParams,
  buildPaginatedResponse,
} from '../../common/dto/pagination.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { FilterOrderDto } from './dto/filter-order.dto';
import { OrderStatus, Role, Prisma } from '@prisma/client';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Machine d'état : transitions autorisées
   */
  private readonly STATE_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    DRAFT: [OrderStatus.PENDING, OrderStatus.CANCELLED],
    PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    CONFIRMED: [OrderStatus.IN_PREPARATION, OrderStatus.CANCELLED],
    IN_PREPARATION: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
    SHIPPED: [OrderStatus.DELIVERED, OrderStatus.DISPUTED, OrderStatus.CANCELLED],
    DELIVERED: [OrderStatus.DISPUTED], // Peut être contesté après livraison
    CANCELLED: [], // État final
    DISPUTED: [OrderStatus.DELIVERED, OrderStatus.CANCELLED], // Résolution du litige
  };

  /**
   * Créer une commande avec calcul automatique des totaux
   */
  async create(clientId: string, dto: CreateOrderDto) {
    // Vérifier que le fournisseur existe
    const supplier = await this.prisma.user.findUnique({
      where: { id: dto.supplierId },
    });
    if (
      !supplier ||
      supplier.role !== Role.SUPPLIER ||
      supplier.status !== 'ACTIVE'
    ) {
      throw new BadRequestException('Fournisseur introuvable');
    }

    // Récupérer tous les produits
    const productIds = dto.items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        supplierId: dto.supplierId,
        isActive: true,
        isPublic: true,
      },
    });

    if (products.length !== dto.items.length) {
      throw new BadRequestException(
        'Certains produits sont introuvables ou ne correspondent pas au fournisseur',
      );
    }

    // Vérifier le stock et calculer les montants
    let totalHT = new Prisma.Decimal(0);
    let totalTax = new Prisma.Decimal(0);

    const itemsData = dto.items.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        throw new BadRequestException(`Produit ${item.productId} introuvable`);
      }

      // Vérifier le stock
      if (product.stockQuantity < item.quantity) {
        throw new BadRequestException(
          `Stock insuffisant pour ${product.name['fr']} (disponible: ${product.stockQuantity})`,
        );
      }

      const lineHT = product.priceHT.mul(item.quantity);
      const lineTax = lineHT.mul(product.taxRate);
      const lineTTC = lineHT.add(lineTax);

      totalHT = totalHT.add(lineHT);
      totalTax = totalTax.add(lineTax);

      return {
        productId: product.id,
        quantity: item.quantity,
        unitPriceHT: product.priceHT,
        taxRate: product.taxRate,
        totalHT: lineHT,
        totalTTC: lineTTC,
        productNameSnapshot: product.name,
      };
    });

    const totalTTC = totalHT.add(totalTax);

    // Générer le numéro de commande
    const orderNumber = await this.generateOrderNumber();

    // Créer la commande avec les items
    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        clientId,
        supplierId: dto.supplierId,
        status: OrderStatus.DRAFT,
        isQuote: dto.isQuote ?? false,
        totalHT,
        totalTax,
        totalTTC,
        deliveryAddress: dto.deliveryAddress ?? null,
        clientNotes: dto.clientNotes,
        items: {
          create: itemsData,
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                images: { take: 1 },
              },
            },
          },
        },
        client: {
          select: { id: true, email: true, displayName: true },
        },
        supplier: {
          select: { id: true, email: true, displayName: true },
        },
      },
    });

    this.logger.log(
      `Order created: ${order.id} (${order.orderNumber}) - Total: ${order.totalTTC} TND`,
    );

    return order;
  }

  /**
   * Liste des commandes avec filtres
   */
  async findAll(
    userId: string,
    userRole: Role,
    pagination: PaginationDto,
    filters?: FilterOrderDto,
  ) {
    const { skip, take } = getPaginationParams(pagination);

    // Construire les conditions de filtrage
    const scope: Prisma.OrderWhereInput =
      userRole === Role.CLIENT
        ? { clientId: userId }
        : userRole === Role.SUPPLIER
          ? { supplierId: userId }
          : {};
    const where: Prisma.OrderWhereInput = {
      AND: [
        scope,
        ...(filters?.status ? [{ status: filters.status }] : []),
        ...(filters?.isQuote !== undefined ? [{ isQuote: filters.isQuote }] : []),
        ...(filters?.supplierId ? [{ supplierId: filters.supplierId }] : []),
        ...(filters?.clientId ? [{ clientId: filters.clientId }] : []),
        ...(filters?.search
          ? [{ orderNumber: { contains: filters.search, mode: 'insensitive' as const } }]
          : []),
      ],
    };

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        skip,
        take,
        where,
        include: {
          client: { select: { id: true, email: true, displayName: true } },
          supplier: { select: { id: true, email: true, displayName: true } },
          _count: { select: { items: true, invoices: true, shipments: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return buildPaginatedResponse(data, total, pagination);
  }

  /**
   * Obtenir une commande par ID
   */
  async findById(id: string, userId: string, userRole: Role) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, email: true, phone: true, displayName: true } },
        supplier: { select: { id: true, email: true, phone: true, displayName: true } },
        items: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                slug: true,
                images: { take: 1, orderBy: { position: 'asc' } },
              },
            },
          },
        },
        invoices: { select: { id: true, invoiceNumber: true, status: true, totalTTC: true } },
        shipments: { select: { id: true, status: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Commande introuvable');
    }

    // Vérifier les permissions
    if (
      userRole !== Role.ADMIN &&
      order.clientId !== userId &&
      order.supplierId !== userId
    ) {
      throw new ForbiddenException("Vous n'avez pas accès à cette commande");
    }

    return order;
  }

  /**
   * Mettre à jour une commande (avant confirmation uniquement)
   */
  async update(id: string, userId: string, userRole: Role, dto: UpdateOrderDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });

    if (!order) {
      throw new NotFoundException('Commande introuvable');
    }

    // Vérifier les permissions
    if (
      userRole !== Role.ADMIN &&
      order.clientId !== userId &&
      order.supplierId !== userId
    ) {
      throw new ForbiddenException("Vous n'avez pas le droit de modifier cette commande");
    }

    // Empêcher la modification si la commande est confirmée ou livrée
    if (
      order.status !== OrderStatus.DRAFT &&
      order.status !== OrderStatus.PENDING
    ) {
      throw new BadRequestException(
        'Cette commande ne peut plus être modifiée (statut: ' + order.status + ')',
      );
    }

    const data: Prisma.OrderUpdateInput = {};
    if (userRole === Role.ADMIN || userRole === Role.CLIENT) {
      data.deliveryAddress = dto.deliveryAddress;
      data.clientNotes = dto.clientNotes;
    }
    if (userRole === Role.ADMIN || userRole === Role.SUPPLIER) {
      data.supplierNotes = dto.supplierNotes;
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const updateResult = await tx.order.updateMany({
        where: {
          id,
          status: { in: [OrderStatus.DRAFT, OrderStatus.PENDING] },
          ...(userRole === Role.CLIENT ? { clientId: userId } : {}),
          ...(userRole === Role.SUPPLIER ? { supplierId: userId } : {}),
        },
        data,
      });
      if (updateResult.count !== 1) {
        throw new ConflictException('La commande a été modifiée par une autre opération');
      }

      return tx.order.findUniqueOrThrow({
        where: { id },
        include: {
          items: { include: { product: true } },
          client: { select: { id: true, email: true, displayName: true } },
          supplier: { select: { id: true, email: true, displayName: true } },
        },
      });
    });

    this.logger.log(`Order updated: ${updated.id} (${updated.orderNumber})`);
    return updated;
  }

  /**
   * Changer le statut d'une commande (avec machine d'état)
   */
  async updateStatus(
    id: string,
    userId: string,
    userRole: Role,
    dto: UpdateOrderStatusDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // Fetch order WITH items and products INSIDE transaction for row locking
      const order = await tx.order.findUnique({
        where: { id },
        include: { items: { include: { product: true } } },
      });

      if (!order) {
        throw new NotFoundException('Commande introuvable');
      }

      // Vérifier les permissions
      if (userRole !== Role.ADMIN) {
        if (userRole === Role.CLIENT && order.clientId !== userId) {
          throw new ForbiddenException("Vous n'avez pas accès à cette commande");
        }
        if (userRole === Role.SUPPLIER && order.supplierId !== userId) {
          throw new ForbiddenException("Vous n'avez pas accès à cette commande");
        }
      }

      // Vérifier que la transition est valide
      const allowedTransitions = this.STATE_TRANSITIONS[order.status];
      if (!allowedTransitions.includes(dto.status)) {
        throw new BadRequestException(
          `Transition invalide : ${order.status} → ${dto.status}. Transitions autorisées : ${allowedTransitions.join(', ')}`,
        );
      }

      const updateData: Prisma.OrderUpdateManyMutationInput = { status: dto.status };

      if (dto.status === OrderStatus.IN_PREPARATION) {
        this.logger.log(`Order ${order.id} is now being prepared`);
      }

      if (dto.status === OrderStatus.CONFIRMED) {
        updateData.confirmedAt = new Date();
      }

      if (dto.status === OrderStatus.DELIVERED) {
        updateData.deliveredAt = new Date();
      }

      if (dto.status === OrderStatus.CANCELLED) {
        if (order.status === OrderStatus.CONFIRMED) {
          this.logger.log(`Stock restored for cancelled order ${order.id}`);
        }
      }

      if (dto.notes) {
        if (userRole === Role.CLIENT) {
          updateData.clientNotes = dto.notes;
        } else if (userRole === Role.SUPPLIER || userRole === Role.ADMIN) {
          updateData.supplierNotes = dto.notes;
        }
      }

      // Handle stock changes with row-level locking (SELECT FOR UPDATE)
      if (dto.status === OrderStatus.CONFIRMED) {
        for (const item of order.items) {
          // Lock the product row to prevent concurrent stock modifications
          await tx.$queryRaw`
            SELECT * FROM "Product" WHERE id = ${item.productId} FOR UPDATE
          `;

          const result = await tx.product.updateMany({
            where: { id: item.productId, stockQuantity: { gte: item.quantity } },
            data: { stockQuantity: { decrement: item.quantity } },
          });
          if (result.count !== 1) {
            throw new BadRequestException('Stock insuffisant au moment de la confirmation');
          }
          this.logger.log(`Stock decremented for order ${order.id}`);
        }
      }

      if (
        dto.status === OrderStatus.CANCELLED &&
        (order.status === OrderStatus.CONFIRMED ||
          order.status === OrderStatus.IN_PREPARATION)
      ) {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stockQuantity: { increment: item.quantity } },
          });
        }
      }

      const result = await tx.order.updateMany({
        where: { id, status: order.status },
        data: updateData,
      });
      if (result.count !== 1) {
        throw new ConflictException('La commande a été modifiée par une autre opération');
      }

      const updated = await tx.order.findUniqueOrThrow({
        where: { id },
        include: {
          items: { include: { product: true } },
          client: { select: { id: true, email: true, displayName: true } },
          supplier: { select: { id: true, email: true, displayName: true } },
        },
      });

      this.logger.log(
        `Order status updated: ${updated.id} (${updated.orderNumber}) - ${order.status} → ${dto.status}`,
      );

      // TODO: Envoyer une notification au client et au fournisseur

      return updated;
    }, { timeout: 10000 });
  }

  /**
   * Annuler une commande
   */
  async cancel(id: string, userId: string, userRole: Role, reason?: string) {
    return this.updateStatus(id, userId, userRole, {
      status: OrderStatus.CANCELLED,
      notes: reason,
    });
  }

  /**
   * Générer un numéro de commande unique (atomic counter)
   */
  private async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `CMD-${year}-`;

    // Atomic increment using upsert
    const counter = await this.prisma.orderCounter.upsert({
      where: { year },
      create: { year, value: 1 },
      update: { value: { increment: 1 } },
    });

    const sequence = counter.value.toString().padStart(5, '0');
    return `${prefix}${sequence}`;
  }

  /**
   * Obtenir le résumé des commandes pour un utilisateur
   */
  async getSummary(userId: string, userRole: Role) {
    const where: Prisma.OrderWhereInput = {};

    if (userRole === Role.CLIENT) {
      where.clientId = userId;
    } else if (userRole === Role.SUPPLIER) {
      where.supplierId = userId;
    }

    const [
      total,
      draft,
      pending,
      confirmed,
      shipped,
      delivered,
      cancelled,
      totalAmount,
    ] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.DRAFT } }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.PENDING } }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.CONFIRMED } }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.SHIPPED } }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.DELIVERED } }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.CANCELLED } }),
      this.prisma.order.aggregate({
        where: {
          ...where,
          status: { in: [OrderStatus.CONFIRMED, OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
        },
        _sum: { totalTTC: true },
      }),
    ]);

    return {
      total,
      byStatus: {
        draft,
        pending,
        confirmed,
        shipped,
        delivered,
        cancelled,
      },
      totalAmount: totalAmount._sum.totalTTC || 0,
    };
  }
}
