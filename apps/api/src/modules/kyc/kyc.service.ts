import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction, KycDocumentType, KycStatus, UserStatus } from '@prisma/client';
import {
  PaginationDto,
  getPaginationParams,
  buildPaginatedResponse,
} from '../../common/dto/pagination.dto';
import { AuditService } from '../audit/audit.service';
import { readFile } from 'fs/promises';
import { basename, resolve, sep } from 'path';

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async getMyKyc(userId: string) {
    const kyc = await this.prisma.kycRecord.findUnique({
      where: { userId },
      include: { documents: true },
    });
    if (!kyc) throw new NotFoundException('Dossier KYC introuvable');
    return kyc;
  }

  async submitDocuments(userId: string, files: Express.Multer.File[], documentTypes?: string[]) {
    if (!files?.length) {
      throw new BadRequestException('Au moins un document KYC est requis');
    }
    if (documentTypes && documentTypes.length !== files.length) {
      throw new BadRequestException('Chaque fichier doit avoir un type de document correspondant');
    }
    const validDocumentTypes = new Set<string>(Object.values(KycDocumentType));
    if (documentTypes?.some((type) => !validDocumentTypes.has(type))) {
      throw new BadRequestException('Type de document KYC invalide');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    let kyc = await this.prisma.kycRecord.findUnique({ where: { userId } });
    if (!kyc) {
      kyc = await this.prisma.kycRecord.create({ data: { userId } });
    }
    if (kyc.status === KycStatus.APPROVED) throw new BadRequestException('KYC déjà approuvé');

    const documentDtos = files.map((file, index) => ({
      kycRecordId: kyc.id,
      documentType: (documentTypes?.[index] ?? KycDocumentType.NATIONAL_ID) as KycDocumentType,
      fileUrl: `/uploads/kyc/${file.filename}`,
      fileName: file.originalname,
      fileSizeBytes: file.size,
      mimeType: file.mimetype,
    }));

    await this.prisma.kycDocument.createMany({ data: documentDtos });
    await this.prisma.kycRecord.update({
      where: { id: kyc.id },
      data: { status: KycStatus.SUBMITTED, submittedAt: new Date() },
    });
    await this.prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.KYC_SUBMITTED, kycSubmittedAt: new Date() },
    });

    this.logger.log(`KYC submitted by user ${userId} — ${files.length} document(s)`);
    return { message: 'Documents KYC soumis avec succès. En attente de validation.', kycId: kyc.id };
  }

  async getAllKyc(pagination: PaginationDto, status?: KycStatus) {
    if (status && !Object.values(KycStatus).includes(status)) {
      throw new BadRequestException('Statut KYC invalide');
    }
    const { skip, take } = getPaginationParams(pagination);
    const where = status ? { status } : {};
    const [data, total] = await Promise.all([
      this.prisma.kycRecord.findMany({
        where,
        skip,
        take,
        include: {
          user: { select: { id: true, email: true, phone: true, role: true, displayName: true } },
          documents: true,
        },
        orderBy: { submittedAt: 'asc' },
      }),
      this.prisma.kycRecord.count({ where }),
    ]);
    return buildPaginatedResponse(data, total, pagination);
  }

  async reviewKyc(kycId: string, adminId: string, approved: boolean, notes?: string) {
    const reviewNotes = notes?.trim() || undefined;
    if (!approved && !reviewNotes) {
      throw new BadRequestException('Un motif est obligatoire pour rejeter un dossier KYC.');
    }

    const kyc = await this.prisma.kycRecord.findUnique({
      where: { id: kycId },
      include: { user: true },
    });
    if (!kyc) throw new NotFoundException('Dossier KYC introuvable');

    const newStatus = approved ? KycStatus.APPROVED : KycStatus.REJECTED;
    const newUserStatus = approved ? UserStatus.ACTIVE : UserStatus.PENDING_KYC;

    await this.prisma.$transaction([
      this.prisma.kycRecord.update({
        where: { id: kycId },
        data: {
          status: newStatus,
          reviewedAt: new Date(),
          reviewedById: adminId,
          adminNotes: reviewNotes,
        },
      }),
      this.prisma.user.update({
        where: { id: kyc.userId },
        data: {
          status: newUserStatus,
          ...(approved ? { kycValidatedAt: new Date() } : {}),
        },
      }),
    ]);

    await this.auditService.log({
      action: approved ? AuditAction.KYC_APPROVED : AuditAction.KYC_REJECTED,
      actorId: adminId,
      targetType: 'KycRecord',
      targetId: kycId,
      metadata: { userId: kyc.userId, notes: reviewNotes },
    });
    this.logger.log(`KYC ${newStatus} for user ${kyc.userId} by admin ${adminId}`);
    return { message: `KYC ${approved ? 'approuvé' : 'rejeté'} avec succès` };
  }

  async getDocumentForAdmin(documentId: string) {
    const document = await this.prisma.kycDocument.findUnique({
      where: { id: documentId },
      select: { fileUrl: true, fileName: true, mimeType: true },
    });
    if (!document) throw new NotFoundException('Document KYC introuvable');

    const directory = resolve(process.cwd(), 'uploads', 'kyc');
    const filename = basename(document.fileUrl);
    const filePath = resolve(directory, filename);
    if (!filename || !filePath.startsWith(`${directory}${sep}`)) {
      throw new NotFoundException('Document KYC introuvable');
    }

    try {
      const contents = await readFile(filePath);
      return {
        contents,
        fileName: document.fileName,
        mimeType: document.mimeType,
      };
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        throw new NotFoundException('Fichier KYC introuvable sur le serveur');
      }
      throw error;
    }
  }

  async suspendExpiredKyc() {
    const now = new Date();
    const expiredUsers = await this.prisma.user.findMany({
      where: {
        status: { in: [UserStatus.PENDING_KYC, UserStatus.KYC_SUBMITTED] },
        kycDeadline: { lt: now },
      },
      select: { id: true, email: true },
    });

    if (expiredUsers.length === 0) return 0;

    await this.prisma.user.updateMany({
      where: { id: { in: expiredUsers.map((u) => u.id) } },
      data: { status: UserStatus.SUSPENDED },
    });

    this.logger.warn(`[KYC CRON] Suspended ${expiredUsers.length} user(s) for KYC deadline exceeded`);
    return expiredUsers.length;
  }
}
