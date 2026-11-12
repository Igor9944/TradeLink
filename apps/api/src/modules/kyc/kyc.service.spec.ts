import { BadRequestException } from '@nestjs/common';
import { AuditAction, KycStatus, UserStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { KycService } from './kyc.service';

describe('KycService.reviewKyc', () => {
  const record = { id: 'kyc-1', userId: 'user-1' };

  function createService() {
    const prisma = {
      kycRecord: {
        findUnique: jest.fn().mockResolvedValue(record),
        update: jest.fn().mockResolvedValue(undefined),
      },
      user: {
        update: jest.fn().mockResolvedValue(undefined),
      },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    const auditService = { log: jest.fn().mockResolvedValue(undefined) };
    const service = new KycService(
      prisma as unknown as PrismaService,
      auditService as unknown as AuditService,
    );
    return { service, prisma, auditService };
  }

  it.each([undefined, '', '   '])('requires a non-empty reason when rejecting (notes: %s)', async (notes) => {
    const { service, prisma } = createService();

    await expect(service.reviewKyc('kyc-1', 'admin-1', false, notes))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.kycRecord.findUnique).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('trims and stores the rejection reason and audit event', async () => {
    const { service, prisma, auditService } = createService();

    await service.reviewKyc('kyc-1', 'admin-1', false, '  Document illisible  ');

    expect(prisma.kycRecord.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        status: KycStatus.REJECTED,
        adminNotes: 'Document illisible',
        reviewedById: 'admin-1',
      }),
    }));
    expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({
      action: AuditAction.KYC_REJECTED,
      actorId: 'admin-1',
      targetId: 'kyc-1',
      metadata: { userId: 'user-1', notes: 'Document illisible' },
    }));
  });

  it('does not require a note to approve a KYC record', async () => {
    const { service, prisma } = createService();

    await service.reviewKyc('kyc-1', 'admin-1', true);

    expect(prisma.kycRecord.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        status: KycStatus.APPROVED,
        adminNotes: undefined,
      }),
    }));
    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: UserStatus.ACTIVE }),
    }));
  });
});
