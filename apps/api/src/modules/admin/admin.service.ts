import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { KycStatus, OrderStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [totalUsers, pendingKyc, activeOrders] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.kycRecord.count({ where: { status: KycStatus.SUBMITTED } }),
      this.prisma.order.count({ where: { status: { in: [OrderStatus.PENDING, OrderStatus.CONFIRMED] } } }),
    ]);
    return { totalUsers, pendingKyc, activeOrders };
  }
}
