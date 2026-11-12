import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  PaginationDto,
  getPaginationParams,
  buildPaginatedResponse,
} from '../../common/dto/pagination.dto';
import { AuditAction, KycStatus, Prisma, Role, UserStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(
    pagination: PaginationDto,
    filters?: { role?: Role; status?: UserStatus; search?: string },
  ) {
    const { skip, take } = getPaginationParams(pagination);
    const search = filters?.search?.trim();
    const where: Prisma.UserWhereInput = {
      ...(filters?.role ? { role: filters.role } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search } },
              ...(['fr', 'en', 'ar'] as const).map((language) => ({
                displayName: {
                  path: [language],
                  string_contains: search,
                  mode: 'insensitive' as const,
                },
              })),
            ],
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          displayName: true,
          avatarUrl: true,
          createdAt: true,
          kycDeadline: true,
          lastLoginAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return buildPaginatedResponse(data, total, pagination);
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        displayName: true,
        avatarUrl: true,
        preferredLang: true,
        timezone: true,
        createdAt: true,
        kycDeadline: true,
        mfaEnabled: true,
        lastLoginAt: true,
        kyc: { select: { status: true } },
      },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }

  async findMe(userId: string) {
    return this.findById(userId);
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findById(id);
    return this.prisma.user.update({
      where: { id },
      data: { ...dto },
      select: {
        id: true,
        email: true,
        phone: true,
        displayName: true,
        avatarUrl: true,
        preferredLang: true,
        timezone: true,
      },
    });
  }

  async updateStatus(id: string, actorId: string, status: UserStatus) {
    if (id === actorId) throw new ForbiddenException('Vous ne pouvez pas modifier le statut de votre propre compte');
    if (status !== UserStatus.ACTIVE && status !== UserStatus.SUSPENDED) {
      throw new BadRequestException('Seuls les statuts Actif et Suspendu peuvent être définis manuellement');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, status: true, kyc: { select: { status: true } } },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    if (user.role === Role.ADMIN) throw new ForbiddenException('Le statut d’un compte administrateur ne peut pas être modifié ici');
    if (status === UserStatus.ACTIVE && user.kyc?.status !== KycStatus.APPROVED) {
      throw new BadRequestException('Le KYC doit être approuvé avant la réactivation du compte');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id }, data: { status } });
      if (status === UserStatus.SUSPENDED) {
        await tx.userSession.updateMany({
          where: { userId: id, isRevoked: false },
          data: { isRevoked: true },
        });
      }
    });
    await this.auditService.log({
      action: status === UserStatus.SUSPENDED ? AuditAction.ACCOUNT_SUSPENDED : AuditAction.ACCOUNT_REACTIVATED,
      actorId,
      targetType: 'User',
      targetId: id,
      metadata: { previousStatus: user.status, status },
    });
    return { id, status };
  }

  async getSessions(userId: string) {
    return this.prisma.userSession.findMany({
      where: { userId, isRevoked: false, expiresAt: { gt: new Date() } },
      select: {
        id: true,
        deviceInfo: true,
        ipAddress: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.userSession.findFirst({ where: { id: sessionId, userId } });
    if (!session) throw new NotFoundException('Session introuvable');
    return this.prisma.userSession.update({ where: { id: sessionId }, data: { isRevoked: true } });
  }
}
