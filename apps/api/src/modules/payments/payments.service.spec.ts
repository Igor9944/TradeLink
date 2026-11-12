import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentsService } from './payments.service';

describe('PaymentsService.findAll', () => {
  const createService = (prisma: Record<string, unknown>) =>
    new PaymentsService(
      prisma as unknown as PrismaService,
      { get: jest.fn() } as unknown as ConfigService,
    );

  it('scopes client payments and applies pagination', async () => {
    const prisma = {
      payment: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };
    const service = createService(prisma);

    await service.findAll('client-1', Role.CLIENT, { page: 2, limit: 10 });

    expect(prisma.payment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { invoice: { is: { order: { clientId: 'client-1' } } } },
            { order: { is: { clientId: 'client-1' } } },
          ],
        },
        skip: 10,
        take: 10,
      }),
    );
    expect(prisma.payment.count).toHaveBeenCalledWith({
      where: {
        OR: [
          { invoice: { is: { order: { clientId: 'client-1' } } } },
          { order: { is: { clientId: 'client-1' } } },
        ],
      },
    });
  });

  it('scopes supplier payments to their orders', async () => {
    const prisma = {
      payment: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };
    const service = createService(prisma);

    await service.findAll('supplier-1', Role.SUPPLIER, { page: 1, limit: 20 });

    expect(prisma.payment.findMany.mock.calls[0][0].where.OR).toEqual([
      { invoice: { is: { order: { supplierId: 'supplier-1' } } } },
      { order: { is: { supplierId: 'supplier-1' } } },
    ]);
  });

  it('rejects roles without payment-list access', async () => {
    const service = createService({});

    await expect(
      service.findAll('transporter-1', Role.TRANSPORTER, { page: 1, limit: 20 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
