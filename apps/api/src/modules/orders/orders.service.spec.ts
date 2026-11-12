import { OrderStatus, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { OrdersService } from './orders.service';

describe('OrdersService access and cancellation', () => {
  it('keeps client list scope when a different client filter is provided', async () => {
    const prisma = {
      order: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };
    const service = new OrdersService(prisma as unknown as PrismaService);

    await service.findAll(
      'client-1',
      Role.CLIENT,
      { page: 1, limit: 10 },
      { clientId: 'client-2' },
    );

    const where = prisma.order.findMany.mock.calls[0][0].where;
    expect(where.AND).toContainEqual({ clientId: 'client-1' });
    expect(where.AND).toContainEqual({ clientId: 'client-2' });
  });

  it('does not allow a client to overwrite the supplier notes', async () => {
    const tx = {
      order: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 'order-1' }),
      },
    };
    const prisma = {
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'order-1',
          clientId: 'client-1',
          supplierId: 'supplier-1',
          status: OrderStatus.PENDING,
        }),
      },
      $transaction: jest.fn((callback) => callback(tx)),
    };
    const service = new OrdersService(prisma as unknown as PrismaService);

    await service.update('order-1', 'client-1', Role.CLIENT, {
      clientNotes: 'Client note',
      supplierNotes: 'Attempt to replace supplier note',
    });

    expect(tx.order.updateMany.mock.calls[0][0].data).toEqual({
      deliveryAddress: undefined,
      clientNotes: 'Client note',
    });
  });

  it('restores reserved stock when a confirmed order is cancelled in preparation', async () => {
    const tx = {
      product: { update: jest.fn().mockResolvedValue({}) },
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'order-1',
          clientId: 'client-1',
          supplierId: 'supplier-1',
          status: OrderStatus.IN_PREPARATION,
          items: [{ productId: 'product-1', quantity: 3 }],
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 'order-1', status: OrderStatus.CANCELLED }),
      },
    };
    const prisma = {
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'order-1',
          clientId: 'client-1',
          supplierId: 'supplier-1',
          status: OrderStatus.IN_PREPARATION,
          items: [{ productId: 'product-1', quantity: 3 }],
        }),
      },
      $transaction: jest.fn((callback) => callback(tx)),
    };
    const service = new OrdersService(prisma as unknown as PrismaService);

    await service.cancel('order-1', 'client-1', Role.CLIENT);

    expect(tx.product.update).toHaveBeenCalledWith({
      where: { id: 'product-1' },
      data: { stockQuantity: { increment: 3 } },
    });
  });
});
