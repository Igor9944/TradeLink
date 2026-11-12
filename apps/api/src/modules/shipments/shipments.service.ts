import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { FilterShipmentDto } from './dto/filter-shipment.dto';
import { UpdateShipmentStatusDto, ShipmentStatus } from './dto/update-shipment-status.dto';
import { AddProofOfDeliveryDto } from './dto/add-proof-of-delivery.dto';
import { OrderStatus, Prisma, Role } from '@prisma/client';

@Injectable()
export class ShipmentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Créer une nouvelle mission de transport
   * Génère automatiquement un numéro unique EXP-YYYY-XXXXX
   * Crée un premier événement avec le statut ASSIGNED
   */
  async create(dto: CreateShipmentDto, currentUserId: string, userRole: Role) {
    // 1. Vérifier que la commande existe et est dans un statut approprié
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException(`Commande ${dto.orderId} introuvable`);
    }
    if (userRole !== Role.ADMIN && (userRole !== Role.SUPPLIER || order.supplierId !== currentUserId)) {
      throw new NotFoundException(`Commande ${dto.orderId} introuvable`);
    }

    // Seules les commandes CONFIRMED ou IN_PREPARATION peuvent avoir un transport assigné
    if (!['CONFIRMED', 'IN_PREPARATION'].includes(order.status)) {
      throw new BadRequestException(
        `Impossible d'assigner un transport : la commande doit être CONFIRMED ou IN_PREPARATION (statut actuel: ${order.status})`
      );
    }

    // 2. Vérifier que le transporteur existe et a le bon rôle
    const transporter = await this.prisma.user.findUnique({
      where: { id: dto.transporterId },
    });

    if (!transporter) {
      throw new NotFoundException(`Transporteur ${dto.transporterId} introuvable`);
    }

    if (transporter.role !== 'TRANSPORTER') {
      throw new BadRequestException('L\'utilisateur doit avoir le rôle TRANSPORTER');
    }
    if (transporter.status !== 'ACTIVE') {
      throw new BadRequestException('Le compte transporteur doit être actif');
    }

    // 3. Générer le numéro d'expédition unique EXP-2026-00001
    const shipmentNumber = await this.generateShipmentNumber();

    // 4. Créer la mission de transport avec le premier événement
    const shipment = await this.prisma.$transaction(async (tx) => {
      const orderUpdate = await tx.order.updateMany({
        where: { id: order.id, status: order.status },
        data: { status: OrderStatus.IN_PREPARATION },
      });
      if (orderUpdate.count !== 1) {
        throw new ConflictException('La commande a été modifiée par une autre opération');
      }

      const created = await tx.shipment.create({
        data: {
          shipmentNumber,
          orderId: dto.orderId,
          transporterId: dto.transporterId,
          status: ShipmentStatus.ASSIGNED,
          estimatedDelivery: dto.estimatedDelivery ? new Date(dto.estimatedDelivery) : null,
          pickupAddress: dto.pickupAddress,
          deliveryAddress: dto.deliveryAddress,
          vehiclePlate: dto.vehiclePlate,
          vehicleType: dto.vehicleType,
          events: {
            create: {
              status: ShipmentStatus.ASSIGNED,
              notes: 'Mission de transport assignée au transporteur',
            },
          },
        },
        include: {
          order: {
            select: {
              orderNumber: true,
              status: true,
              totalTTC: true,
            },
          },
          transporter: {
            select: {
              id: true,
              email: true,
              displayName: true,
              phone: true,
            },
          },
          events: true,
        },
      });

      return created;
    });

    return shipment;
  }

  /**
   * Récupérer toutes les missions avec filtres optionnels
   */
  async findAll(filters: FilterShipmentDto, userId: string, userRole: Role) {
    const scope = this.getUserShipmentScope(userId, userRole);
    const where: Prisma.ShipmentWhereInput = {
      AND: [
        scope,
        ...(filters.orderId ? [{ orderId: filters.orderId }] : []),
        ...(filters.transporterId ? [{ transporterId: filters.transporterId }] : []),
        ...(filters.status ? [{ status: filters.status }] : []),
        ...(filters.shipmentNumber
          ? [{ shipmentNumber: { contains: filters.shipmentNumber, mode: 'insensitive' as const } }]
          : []),
      ],
    };

    return this.prisma.shipment.findMany({
      where,
      include: {
        order: {
          select: {
            orderNumber: true,
            status: true,
            totalTTC: true,
          },
        },
        transporter: {
          select: {
            id: true,
            email: true,
            displayName: true,
            phone: true,
          },
        },
        events: {
          orderBy: { timestamp: 'desc' },
          take: 1, // Dernier événement seulement
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Récupérer une mission spécifique avec son historique complet
   */
  async findOne(id: string, userId: string, userRole: Role) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            clientId: true,
            supplierId: true,
            orderNumber: true,
            status: true,
            totalTTC: true,
            client: {
              select: {
                email: true,
                displayName: true,
                phone: true,
              },
            },
          },
        },
        transporter: {
          select: {
            id: true,
            email: true,
            displayName: true,
            phone: true,
          },
        },
        events: {
          orderBy: { timestamp: 'desc' },
        },
        proofOfDelivery: true,
      },
    });

    if (!shipment) {
      throw new NotFoundException(`Mission de transport ${id} introuvable`);
    }
    this.assertShipmentAccess(shipment, userId, userRole);

    return shipment;
  }

  /**
   * Mettre à jour le statut d'une expédition
   * Crée automatiquement un événement dans l'historique (ShipmentEvent)
   * Transitions valides :
   * ASSIGNED → PICKUP → PICKED_UP → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED
   * Tout statut → FAILED ou RETURNED
   */
  async updateStatus(id: string, dto: UpdateShipmentStatusDto, currentUserId: string, userRole: Role) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id },
      include: {
        transporter: true,
        order: true,
      },
    });

    if (!shipment) {
      throw new NotFoundException(`Mission de transport ${id} introuvable`);
    }

    // Seulement le transporteur assigné peut mettre à jour le statut
    if (userRole !== Role.ADMIN && shipment.transporterId !== currentUserId) {
      throw new ForbiddenException('Vous n\'êtes pas autorisé à modifier cette mission de transport');
    }

    // Valider la transition de statut
    this.validateStatusTransition(shipment.status as ShipmentStatus, dto.status);

    const updated = await this.prisma.$transaction(async (tx) => {
      const shipmentUpdate = await tx.shipment.updateMany({
        where: { id, status: shipment.status },
        data: {
          status: dto.status,
          deliveredAt: dto.status === ShipmentStatus.DELIVERED ? new Date() : undefined,
        },
      });
      if (shipmentUpdate.count !== 1) {
        throw new ConflictException('L\'expédition a été modifiée par une autre opération');
      }

      await tx.shipmentEvent.create({
        data: {
          shipmentId: id,
          status: dto.status,
          location: dto.location,
          notes: dto.notes,
        },
      });

      if (dto.status === ShipmentStatus.PICKED_UP) {
        if (shipment.order.status === OrderStatus.IN_PREPARATION) {
          const orderUpdate = await tx.order.updateMany({
            where: { id: shipment.orderId, status: OrderStatus.IN_PREPARATION },
            data: { status: OrderStatus.SHIPPED },
          });
          if (orderUpdate.count !== 1) {
            throw new ConflictException('La commande a été modifiée par une autre opération');
          }
        } else if (shipment.order.status !== OrderStatus.SHIPPED) {
          throw new ConflictException('Le statut de la commande ne permet pas cet avancement');
        }
      }

      if (dto.status === ShipmentStatus.DELIVERED) {
        const orderLock = await tx.order.updateMany({
          where: { id: shipment.orderId, status: OrderStatus.SHIPPED },
          data: { status: OrderStatus.SHIPPED },
        });
        if (orderLock.count !== 1) {
          const currentOrder = await tx.order.findUnique({
            where: { id: shipment.orderId },
            select: { status: true },
          });
          if (currentOrder?.status !== OrderStatus.DELIVERED) {
            throw new ConflictException('Le statut de la commande ne permet pas cette livraison');
          }
        }

        const undeliveredCount = await tx.shipment.count({
          where: { orderId: shipment.orderId, status: { not: ShipmentStatus.DELIVERED } },
        });
        if (undeliveredCount === 0) {
          const orderUpdate = await tx.order.updateMany({
            where: { id: shipment.orderId, status: OrderStatus.SHIPPED },
            data: { status: OrderStatus.DELIVERED, deliveredAt: new Date() },
          });
          if (orderUpdate.count === 0) {
            const currentOrder = await tx.order.findUnique({
              where: { id: shipment.orderId },
              select: { status: true },
            });
            if (currentOrder?.status !== OrderStatus.DELIVERED) {
              throw new ConflictException('La commande a été modifiée par une autre opération');
            }
          }
        }
      }

      return tx.shipment.findUniqueOrThrow({
        where: { id },
        include: {
          events: { orderBy: { timestamp: 'desc' }, take: 5 },
        },
      });
    });

    return updated;
  }

  /**
   * Ajouter une preuve de livraison (photo + signature)
   * Ne peut être ajouté que si le statut est DELIVERED
   */
  async addProofOfDelivery(
    shipmentId: string,
    dto: AddProofOfDeliveryDto,
    currentUserId: string,
    userRole: Role,
  ) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
    });

    if (!shipment) {
      throw new NotFoundException(`Mission de transport ${shipmentId} introuvable`);
    }

    // Seulement le transporteur peut ajouter la preuve
    if (userRole !== Role.ADMIN && shipment.transporterId !== currentUserId) {
      throw new ForbiddenException('Vous n\'êtes pas autorisé à ajouter une preuve de livraison');
    }

    // La mission doit être livrée
    if (shipment.status !== ShipmentStatus.DELIVERED) {
      throw new BadRequestException('La preuve de livraison ne peut être ajoutée que pour un statut DELIVERED');
    }

    // Créer ou mettre à jour la preuve
    const proof = await this.prisma.proofOfDelivery.upsert({
      where: { shipmentId },
      create: {
        shipmentId,
        photoUrls: dto.photoUrls,
        signatureUrl: dto.signatureUrl,
        receiverName: dto.receiverName,
        notes: dto.notes,
      },
      update: {
        photoUrls: dto.photoUrls,
        signatureUrl: dto.signatureUrl,
        receiverName: dto.receiverName,
        notes: dto.notes,
      },
    });

    return proof;
  }

  /**
   * Récupérer l'historique de tracking d'une expédition
   */
  async getTrackingHistory(shipmentId: string, userId: string, userRole: Role) {
    const shipment = await this.findOne(shipmentId, userId, userRole);

    return {
      shipmentNumber: shipment.shipmentNumber,
      currentStatus: shipment.status,
      estimatedDelivery: shipment.estimatedDelivery,
      deliveredAt: shipment.deliveredAt,
      events: shipment.events,
    };
  }

  /**
   * Statistiques des expéditions par transporteur
   */
  async getTransporterStats(transporterId: string, userId: string, userRole: Role) {
    if (userRole !== Role.ADMIN && userId !== transporterId) {
      throw new NotFoundException('Transporteur introuvable');
    }
    const [total, assigned, inProgress, delivered, failed] = await Promise.all([
      this.prisma.shipment.count({ where: { transporterId } }),
      this.prisma.shipment.count({ where: { transporterId, status: ShipmentStatus.ASSIGNED } }),
      this.prisma.shipment.count({
        where: {
          transporterId,
          status: {
            in: [ShipmentStatus.PICKUP, ShipmentStatus.PICKED_UP, ShipmentStatus.IN_TRANSIT, ShipmentStatus.OUT_FOR_DELIVERY],
          },
        },
      }),
      this.prisma.shipment.count({ where: { transporterId, status: ShipmentStatus.DELIVERED } }),
      this.prisma.shipment.count({
        where: {
          transporterId,
          status: { in: [ShipmentStatus.FAILED, ShipmentStatus.RETURNED] },
        },
      }),
    ]);

    return {
      total,
      assigned,
      inProgress,
      delivered,
      failed,
      successRate: total > 0 ? ((delivered / total) * 100).toFixed(2) + '%' : '0%',
    };
  }

  private getUserShipmentScope(userId: string, userRole: Role): Prisma.ShipmentWhereInput {
    switch (userRole) {
      case Role.ADMIN:
        return {};
      case Role.CLIENT:
        return { order: { clientId: userId } };
      case Role.SUPPLIER:
        return { order: { supplierId: userId } };
      case Role.TRANSPORTER:
        return { transporterId: userId };
      default:
        throw new ForbiddenException('Accès refusé');
    }
  }

  private assertShipmentAccess(
    shipment: { transporterId: string; order: { clientId: string; supplierId: string } },
    userId: string,
    userRole: Role,
  ) {
    if (
      userRole !== Role.CLIENT &&
      userRole !== Role.SUPPLIER &&
      userRole !== Role.TRANSPORTER &&
      userRole !== Role.ADMIN
    ) {
      throw new ForbiddenException('Accès refusé');
    }
    if (
      userRole !== Role.ADMIN &&
      shipment.transporterId !== userId &&
      shipment.order.clientId !== userId &&
      shipment.order.supplierId !== userId
    ) {
      throw new NotFoundException('Expédition introuvable');
    }
  }

  /**
   * Générer un numéro d'expédition unique au format EXP-YYYY-XXXXX
   */
  private async generateShipmentNumber(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `EXP-${currentYear}-`;

    // Chercher le dernier numéro de l'année
    const lastShipment = await this.prisma.shipment.findFirst({
      where: {
        shipmentNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    let nextNumber = 1;
    if (lastShipment) {
      const lastNumber = parseInt(lastShipment.shipmentNumber.split('-')[2]);
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${String(nextNumber).padStart(5, '0')}`;
  }

  /**
   * Valider les transitions de statut autorisées
   */
  private validateStatusTransition(currentStatus: ShipmentStatus, newStatus: ShipmentStatus) {
    const allowedTransitions: Record<ShipmentStatus, ShipmentStatus[]> = {
      [ShipmentStatus.ASSIGNED]: [ShipmentStatus.PICKUP, ShipmentStatus.FAILED],
      [ShipmentStatus.PICKUP]: [ShipmentStatus.PICKED_UP, ShipmentStatus.FAILED],
      [ShipmentStatus.PICKED_UP]: [ShipmentStatus.IN_TRANSIT, ShipmentStatus.FAILED, ShipmentStatus.RETURNED],
      [ShipmentStatus.IN_TRANSIT]: [ShipmentStatus.OUT_FOR_DELIVERY, ShipmentStatus.FAILED, ShipmentStatus.RETURNED],
      [ShipmentStatus.OUT_FOR_DELIVERY]: [ShipmentStatus.DELIVERED, ShipmentStatus.FAILED, ShipmentStatus.RETURNED],
      [ShipmentStatus.DELIVERED]: [], // État final
      [ShipmentStatus.FAILED]: [ShipmentStatus.ASSIGNED], // Possibilité de réassigner
      [ShipmentStatus.RETURNED]: [], // État final
    };

    const allowed = allowedTransitions[currentStatus] || [];

    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Transition invalide : impossible de passer de ${currentStatus} à ${newStatus}`
      );
    }
  }
}
