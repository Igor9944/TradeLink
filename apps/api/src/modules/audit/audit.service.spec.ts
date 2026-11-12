import { AuditAction } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from './audit.service';

describe('AuditService.listForAdmin', () => {
  it('filters logs, bounds the page, and includes only the actor display name', async () => {
    const data = [{ id: 'log-1', action: AuditAction.LOGIN, actor: { id: 'user-1', displayName: 'Admin' } }];
    const prisma = {
      auditLog: {
        findMany: jest.fn().mockResolvedValue(data),
        count: jest.fn().mockResolvedValue(1),
      },
    };
    const service = new AuditService(prisma as unknown as PrismaService);
    const pagination: PaginationDto = { page: 2, limit: 10 };

    await expect(service.listForAdmin(pagination, {
      action: AuditAction.LOGIN,
      targetType: 'user',
    })).resolves.toEqual({
      data,
      meta: { total: 1, page: 2, limit: 10, totalPages: 1 },
    });

    const expectedWhere = {
      action: AuditAction.LOGIN,
      targetType: { contains: 'user', mode: 'insensitive' },
    };
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
      where: expectedWhere,
      skip: 10,
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: expect.objectContaining({
        actor: { select: { id: true, displayName: true } },
        metadata: true,
        ipAddress: true,
        userAgent: true,
      }),
    });
    expect(prisma.auditLog.count).toHaveBeenCalledWith({ where: expectedWhere });
  });
});
