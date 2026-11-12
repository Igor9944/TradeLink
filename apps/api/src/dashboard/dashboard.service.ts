import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InvoiceStatus, KycStatus, OrderStatus, Prisma, Role, ShipmentStatus, UserStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getActivity(userId: string, period: string) {
    if (!['7d', '30d', '12m'].includes(period)) {
      throw new BadRequestException('Période invalide');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const now = new Date();
    const monthly = period === '12m';
    const bucketCount = period === '7d' ? 7 : monthly ? 12 : 30;
    const start = monthly
      ? new Date(now.getFullYear(), now.getMonth() - 11, 1)
      : new Date(now.getFullYear(), now.getMonth(), now.getDate() - bucketCount + 1);
    const orderFilter = this.getOrderFilter(userId, user.role);
    const shipmentFilter = this.getShipmentFilter(userId, user.role);

    const [orders, shipments, payments] = await Promise.all([
      this.prisma.order.findMany({
        where: { ...orderFilter, createdAt: { gte: start } },
        select: { createdAt: true },
      }),
      this.prisma.shipment.findMany({
        where: { ...shipmentFilter, createdAt: { gte: start } },
        select: { createdAt: true },
      }),
      this.prisma.invoice.findMany({
        where: {
          status: InvoiceStatus.PAID,
          order: orderFilter,
          paidAt: { gte: start },
        },
        select: { paidAt: true },
      }),
    ]);

    const points = Array.from({ length: bucketCount }, (_, index) => {
      const date = monthly
        ? new Date(start.getFullYear(), start.getMonth() + index, 1)
        : new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
      const key = monthly
        ? `${date.getFullYear()}-${date.getMonth()}`
        : `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const label = monthly
        ? date.toLocaleString('fr-FR', { month: 'short', year: '2-digit' })
        : date.toLocaleString('fr-FR', { day: 'numeric', month: 'short' });
      return { key, date, label, orders: 0, shipments: 0, payments: 0 };
    });
    const byKey = new Map(points.map((point) => [point.key, point]));
    const getKey = (date: Date) => monthly
      ? `${date.getFullYear()}-${date.getMonth()}`
      : `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

    for (const order of orders) {
      const point = byKey.get(getKey(order.createdAt));
      if (point) point.orders += 1;
    }
    for (const shipment of shipments) {
      const point = byKey.get(getKey(shipment.createdAt));
      if (point) point.shipments += 1;
    }
    for (const payment of payments) {
      if (!payment.paidAt) continue;
      const point = byKey.get(getKey(payment.paidAt));
      if (point) point.payments += 1;
    }

    return {
      period,
      points: points.map(({ date, label, orders: orderCount, shipments: shipmentCount, payments: paymentCount }) => ({
        label,
        date: date.toISOString(),
        orders: orderCount,
        shipments: shipmentCount,
        payments: paymentCount,
      })),
    };
  }

  async getStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const orderFilter = this.getOrderFilter(userId, user.role);
    const shipmentFilter = this.getShipmentFilter(userId, user.role);
    const productFilter: Prisma.ProductWhereInput =
      user.role === Role.ADMIN || user.role === Role.ACCOUNTANT
        ? { isActive: true }
        : user.role === Role.SUPPLIER
          ? { supplierId: userId, isActive: true }
          : { isActive: true, isPublic: true };

    const adminMetricsPromise = user.role === Role.ADMIN
      ? Promise.all([
          this.prisma.user.count(),
          this.prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
          this.prisma.user.count({ where: { status: UserStatus.SUSPENDED } }),
          this.prisma.kycRecord.count({ where: { status: KycStatus.SUBMITTED } }),
        ])
      : Promise.resolve(null);

    const [totalOrders, pendingOrders, completedOrders, activeShipments, totalProducts, revenueByCurrency] =
      await Promise.all([
        this.prisma.order.count({ where: orderFilter }),
        this.prisma.order.count({
          where: { ...orderFilter, status: { in: [OrderStatus.PENDING, OrderStatus.CONFIRMED] } },
        }),
        this.prisma.order.count({ where: { ...orderFilter, status: OrderStatus.DELIVERED } }),
        this.prisma.shipment.count({
          where: {
            ...shipmentFilter,
            status: {
              in: [
                ShipmentStatus.PICKED_UP,
                ShipmentStatus.IN_TRANSIT,
                ShipmentStatus.OUT_FOR_DELIVERY,
              ],
            },
          },
        }),
        this.prisma.product.count({ where: productFilter }),
        this.prisma.invoice.groupBy({
          by: ['currency'],
          where: {
            status: InvoiceStatus.PAID,
            order: orderFilter,
          },
          _sum: { totalTTC: true },
        }),
      ]);
    const adminMetrics = await adminMetricsPromise;

    // Commandes récentes
    const recentOrders = await this.prisma.order.findMany({
      where: orderFilter,
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        orderNumber: true,
        totalTTC: true,
        currency: true,
        status: true,
        createdAt: true,
      },
    });

    // Mapper totalTTC vers totalAmount pour le frontend
    const mappedOrders = recentOrders.map((order) => ({
      ...order,
      totalAmount: order.totalTTC,
    }));

    // Revenus par mois (derniers 6 mois)
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const monthlyInvoices = await this.prisma.invoice.findMany({
      where: {
        status: InvoiceStatus.PAID,
        order: orderFilter,
        paidAt: { gte: sixMonthsAgo },
      },
      select: { paidAt: true, totalTTC: true, currency: true },
      orderBy: { paidAt: 'asc' },
    });

    // Grouper par mois
    const revenueByMonth = monthlyInvoices.reduce((acc, inv) => {
      if (!inv.paidAt) return acc;
      const monthKey = inv.paidAt.toLocaleString('fr-FR', { month: 'short' });
      const existing = acc.find((m) => m.month === monthKey && m.currency === inv.currency);
      const amount = Number(inv.totalTTC);
      if (existing) {
        existing.revenue += amount;
      } else {
        acc.push({
          month: monthKey,
          date: new Date(inv.paidAt.getFullYear(), inv.paidAt.getMonth(), 1).toISOString(),
          currency: inv.currency,
          revenue: amount,
        });
      }
      return acc;
    }, [] as { month: string; date: string; currency: string; revenue: number }[]);

    return {
      totalOrders,
      totalRevenueByCurrency: revenueByCurrency.map((revenue) => ({
        currency: revenue.currency,
        amount: Number(revenue._sum.totalTTC ?? 0),
      })),
      pendingOrders,
      completedOrders,
      totalProducts,
      activeShipments,
      recentOrders: mappedOrders,
      revenueByMonth,
      ...(adminMetrics && {
        adminMetrics: {
          totalUsers: adminMetrics[0],
          activeUsers: adminMetrics[1],
          suspendedUsers: adminMetrics[2],
          pendingKyc: adminMetrics[3],
        },
      }),
    };
  }

  private getOrderFilter(userId: string, role: Role): Prisma.OrderWhereInput {
    switch (role) {
      case Role.ADMIN:
      case Role.ACCOUNTANT:
        return {};
      case Role.CLIENT:
        return { clientId: userId };
      case Role.SUPPLIER:
        return { supplierId: userId };
      case Role.TRANSPORTER:
        return { shipments: { some: { transporterId: userId } } };
      default:
        throw new ForbiddenException('Accès refusé');
    }
  }

  private getShipmentFilter(userId: string, role: Role): Prisma.ShipmentWhereInput {
    switch (role) {
      case Role.ADMIN:
      case Role.ACCOUNTANT:
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
}
