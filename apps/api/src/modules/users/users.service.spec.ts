import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { AuditAction, KycStatus, Role, UserStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UsersService } from './users.service';

describe('UsersService administrative status changes', () => {
  it('applies search and role/status filters before pagination', async () => {
    const prisma = {
      user: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };
    const service = new UsersService(
      prisma as unknown as PrismaService,
      { log: jest.fn() } as unknown as AuditService,
    );

    await service.findAll(
      { page: 2, limit: 10 },
      { role: Role.SUPPLIER, status: UserStatus.ACTIVE, search: '  alice  ' },
    );

    const where = {
      role: Role.SUPPLIER,
      status: UserStatus.ACTIVE,
      OR: [
        { email: { contains: 'alice', mode: 'insensitive' } },
        { phone: { contains: 'alice' } },
        ...(['fr', 'en', 'ar'] as const).map((language) => ({
          displayName: {
            path: [language],
            string_contains: 'alice',
            mode: 'insensitive',
          },
        })),
      ],
    };
    expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where,
      skip: 10,
      take: 10,
    }));
    expect(prisma.user.count).toHaveBeenCalledWith({ where });
  });

  const createService = (userOverrides: Record<string, unknown> = {}) => {
    const user = {
      id: 'target-user',
      role: Role.CLIENT,
      status: UserStatus.ACTIVE,
      kyc: { status: KycStatus.APPROVED },
      ...userOverrides,
    };
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(user),
        update: jest.fn().mockResolvedValue(undefined),
      },
      userSession: {
        updateMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
      $transaction: jest.fn(async (callback) =>
        callback({ user: prisma.user, userSession: prisma.userSession }),
      ),
    };
    const audit = { log: jest.fn().mockResolvedValue(undefined) };
    const service = new UsersService(
      prisma as unknown as PrismaService,
      audit as unknown as AuditService,
    );
    return { service, prisma, audit };
  };

  it('suspends the account, revokes active sessions, and records the actor', async () => {
    const { service, prisma, audit } = createService();

    await expect(
      service.updateStatus('target-user', 'admin-user', UserStatus.SUSPENDED),
    ).resolves.toEqual({ id: 'target-user', status: UserStatus.SUSPENDED });

    expect(prisma.userSession.updateMany).toHaveBeenCalledWith({
      where: { userId: 'target-user', isRevoked: false },
      data: { isRevoked: true },
    });
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
      action: AuditAction.ACCOUNT_SUSPENDED,
      actorId: 'admin-user',
      targetId: 'target-user',
    }));
  });

  it('prevents an administrator from suspending their own account', async () => {
    const { service, prisma } = createService();

    await expect(
      service.updateStatus('admin-user', 'admin-user', UserStatus.SUSPENDED),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('does not reactivate an account before its KYC is approved', async () => {
    const { service, prisma } = createService({
      status: UserStatus.SUSPENDED,
      kyc: { status: KycStatus.REJECTED },
    });

    await expect(
      service.updateStatus('target-user', 'admin-user', UserStatus.ACTIVE),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
