import { KycStatus, Role, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardService } from './dashboard.service';

describe('DashboardService activity periods', () => {
  it('returns daily activity counts for orders, shipments, and paid invoices', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ role: Role.CLIENT }) },
      order: { findMany: jest.fn().mockResolvedValue([{ createdAt: yesterday }]) },
      shipment: { findMany: jest.fn().mockResolvedValue([{ createdAt: yesterday }]) },
      invoice: { findMany: jest.fn().mockResolvedValue([{ paidAt: yesterday }]) },
    };
    const service = new DashboardService(prisma as unknown as PrismaService);

    const result = await service.getActivity('client-1', '7d');

    expect(result.period).toBe('7d');
    expect(result.points).toHaveLength(7);
    expect(result.points.reduce((sum, point) => sum + point.orders, 0)).toBe(1);
    expect(result.points.reduce((sum, point) => sum + point.shipments, 0)).toBe(1);
    expect(result.points.reduce((sum, point) => sum + point.payments, 0)).toBe(1);
    expect(prisma.order.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ clientId: 'client-1', createdAt: expect.any(Object) }),
    }));
  });
});

describe('DashboardService admin statistics', () => {
  it('returns platform-wide user and pending KYC counts for admins', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({ role: Role.ADMIN }),
        count: jest.fn(({ where }: { where?: { status?: UserStatus } } = {}) => {
          if (where?.status === UserStatus.ACTIVE) return 3;
          if (where?.status === UserStatus.SUSPENDED) return 1;
          return 5;
        }),
      },
      order: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
      },
      shipment: { count: jest.fn().mockResolvedValue(0) },
      product: { count: jest.fn().mockResolvedValue(0) },
      kycRecord: {
        count: jest.fn(({ where }: { where: { status: KycStatus } }) =>
          where.status === KycStatus.SUBMITTED ? 2 : 0,
        ),
      },
      invoice: {
        groupBy: jest.fn().mockResolvedValue([]),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const service = new DashboardService(prisma as unknown as PrismaService);

    const result = await service.getStats('admin-1');

    expect(result.adminMetrics).toEqual({
      totalUsers: 5,
      activeUsers: 3,
      suspendedUsers: 1,
      pendingKyc: 2,
    });
    expect(prisma.user.count).toHaveBeenCalledWith({ where: { status: UserStatus.ACTIVE } });
    expect(prisma.kycRecord.count).toHaveBeenCalledWith({ where: { status: KycStatus.SUBMITTED } });
  });
});
