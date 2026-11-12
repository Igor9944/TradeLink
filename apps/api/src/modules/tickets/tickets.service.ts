import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { FilterTicketDto } from './dto/filter-ticket.dto';
import { UpdateTicketStatusDto, TicketStatus } from './dto/update-ticket-status.dto';
import { AddTicketMessageDto } from './dto/add-ticket-message.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Créer un nouveau ticket de support
   * Génère automatiquement un numéro unique TKT-YYYY-XXXXX
   * Crée un premier message si fourni
   */
  async create(userId: string, dto: CreateTicketDto) {
    // Générer le numéro de ticket
    const ticketNumber = await this.generateTicketNumber();

    // Créer le ticket
    const ticket = await this.prisma.ticket.create({
      data: {
        ticketNumber,
        createdById: userId,
        subject: dto.subject,
        status: TicketStatus.OPEN,
        priority: dto.priority ?? 'MEDIUM',
        category: dto.category,
        contextType: dto.contextType,
        contextId: dto.contextId,
        messages: dto.message
          ? {
              create: {
                senderId: userId,
                message: dto.message,
              },
            }
          : undefined,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            displayName: true,
            role: true,
          },
        },
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1,
        },
      },
    });

    return ticket;
  }

  /**
   * Lister tous les tickets avec filtres
   */
  async findAll(filters: FilterTicketDto, currentUserId: string, userRole: string) {
    const canViewAll = ['SUPPORT', 'ADMIN'].includes(userRole);
    const where: Prisma.TicketWhereInput = {
      ...(canViewAll ? {} : { createdById: currentUserId }),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.priority ? { priority: filters.priority } : {}),
      ...(filters.category ? { category: filters.category } : {}),
      ...(canViewAll && filters.assignedToId ? { assignedToId: filters.assignedToId } : {}),
      ...(canViewAll && filters.createdById ? { createdById: filters.createdById } : {}),
    };

    return this.prisma.ticket.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            displayName: true,
            role: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1, // Dernier message seulement
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: 50,
    });
  }

  /**
   * Récupérer un ticket avec tous ses messages
   */
  async findOne(ticketNumber: string, currentUserId: string, userRole: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { ticketNumber },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            displayName: true,
            role: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
        messages: {
          orderBy: { sentAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket ${ticketNumber} introuvable`);
    }

    // Vérifier que l'utilisateur a accès au ticket
    const isOwner = ticket.createdById === currentUserId;
    const isAssignee = ticket.assignedToId === currentUserId;
    const isSupport = ['SUPPORT', 'ADMIN'].includes(userRole);

    if (!isOwner && !isAssignee && !isSupport) {
      throw new ForbiddenException('Vous n\'avez pas accès à ce ticket');
    }

    return ticket;
  }

  /**
   * Ajouter un message à un ticket
   */
  async addMessage(
    ticketNumber: string,
    dto: AddTicketMessageDto,
    senderId: string,
    userRole: string,
  ) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { ticketNumber },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket ${ticketNumber} introuvable`);
    }
    if (
      ticket.createdById !== senderId &&
      ticket.assignedToId !== senderId &&
      !['SUPPORT', 'ADMIN'].includes(userRole)
    ) {
      throw new NotFoundException(`Ticket ${ticketNumber} introuvable`);
    }

    // Ne peut pas ajouter de messages à un ticket CLOSED
    if (ticket.status === TicketStatus.CLOSED) {
      throw new BadRequestException('Impossible d\'ajouter un message à un ticket fermé');
    }

    const message = await this.prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        senderId,
        message: dto.message,
        isAiSuggestion:
          ['SUPPORT', 'ADMIN'].includes(userRole) && (dto.isAiSuggestion ?? false),
        attachmentUrl: dto.attachmentUrl,
      },
    });

    // Si le ticket était RESOLVED, le repasser en IN_PROGRESS
    if (ticket.status === TicketStatus.RESOLVED) {
      await this.prisma.ticket.update({
        where: { id: ticket.id },
        data: { status: TicketStatus.IN_PROGRESS },
      });
    }

    return message;
  }

  /**
   * Mettre à jour le statut d'un ticket
   * Seuls SUPPORT et ADMIN peuvent changer le statut
   */
  async updateStatus(ticketNumber: string, dto: UpdateTicketStatusDto, userId: string, userRole: string) {
    if (!['SUPPORT', 'ADMIN'].includes(userRole)) {
      throw new ForbiddenException('Seuls les agents de support peuvent modifier le statut d\'un ticket');
    }

    const ticket = await this.prisma.ticket.findUnique({
      where: { ticketNumber },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket ${ticketNumber} introuvable`);
    }

    const updated = await this.prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: dto.status,
        resolvedAt: dto.status === TicketStatus.RESOLVED || dto.status === TicketStatus.CLOSED ? new Date() : undefined,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Assigner un ticket à un agent de support
   * Seuls SUPPORT et ADMIN peuvent assigner
   */
  async assignTicket(ticketNumber: string, assigneeId: string, currentUserId: string, userRole: string) {
    if (!['SUPPORT', 'ADMIN'].includes(userRole)) {
      throw new ForbiddenException('Seuls les agents de support peuvent assigner un ticket');
    }

    const ticket = await this.prisma.ticket.findUnique({
      where: { ticketNumber },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket ${ticketNumber} introuvable`);
    }

    // Vérifier que l'assigné existe et a le rôle approprié
    const assignee = await this.prisma.user.findUnique({
      where: { id: assigneeId },
    });

    if (!assignee || !['SUPPORT', 'ADMIN'].includes(assignee.role)) {
      throw new BadRequestException('L\'assigné doit être un agent SUPPORT ou ADMIN');
    }

    const updated = await this.prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        assignedToId: assigneeId,
        status: ticket.status === TicketStatus.OPEN ? TicketStatus.IN_PROGRESS : ticket.status,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Statistiques des tickets par statut
   */
  async getStats(userId?: string) {
    const where: Prisma.TicketWhereInput = userId ? { createdById: userId } : {};

    const [total, open, inProgress, resolved, closed] = await Promise.all([
      this.prisma.ticket.count({ where }),
      this.prisma.ticket.count({ where: { ...where, status: TicketStatus.OPEN } }),
      this.prisma.ticket.count({ where: { ...where, status: TicketStatus.IN_PROGRESS } }),
      this.prisma.ticket.count({ where: { ...where, status: TicketStatus.RESOLVED } }),
      this.prisma.ticket.count({ where: { ...where, status: TicketStatus.CLOSED } }),
    ]);

    return {
      total,
      open,
      inProgress,
      resolved,
      closed,
      resolutionRate: total > 0 ? (((resolved + closed) / total) * 100).toFixed(2) + '%' : '0%',
    };
  }

  /**
   * Générer un numéro de ticket unique au format TKT-YYYY-XXXXX
   */
  private async generateTicketNumber(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `TKT-${currentYear}-`;

    // Chercher le dernier numéro de l'année
    const lastTicket = await this.prisma.ticket.findFirst({
      where: {
        ticketNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    let nextNumber = 1;
    if (lastTicket) {
      const lastNumber = parseInt(lastTicket.ticketNumber.split('-')[2]);
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${String(nextNumber).padStart(5, '0')}`;
  }
}
