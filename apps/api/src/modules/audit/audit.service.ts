import { Injectable } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { PaginationDto, buildPaginatedResponse, getPaginationParams } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    actorId?: string;
    action: AuditAction;
    targetType?: string;
    targetId?: string;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.prisma.auditLog.create({ data: params });
  }

  async findAll(skip?: number, take?: number) {
    return this.prisma.auditLog.findMany({
      skip: skip ?? 0,
      take: take ?? 100,
      orderBy: { createdAt: 'desc' },
    });
  }

  async listForAdmin(
    pagination: PaginationDto,
    filters: { action?: AuditAction; targetType?: string },
  ) {
    const { skip, take } = getPaginationParams(pagination);
    const where: Prisma.AuditLogWhereInput = {
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.targetType
        ? { targetType: { contains: filters.targetType, mode: 'insensitive' } }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          action: true,
          targetType: true,
          targetId: true,
          metadata: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true,
          actor: { select: { id: true, displayName: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return buildPaginatedResponse(data, total, pagination);
  }
}
