import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  ParticipantRole,
  ParticipantStatus,
  Prisma,
  Role,
  RoomStatus,
  RoomType,
} from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { UpdateParticipantDto } from './dto/update-participant.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { ROOM_MEDIA_PROVIDER, type RoomMediaProvider } from './media-provider.interface';

const activeParticipantStatuses = [ParticipantStatus.WAITING, ParticipantStatus.ADMITTED];
const isTerminalRoomStatus = (status: RoomStatus) =>
  status === RoomStatus.ENDED || status === RoomStatus.CANCELLED;

@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject(ROOM_MEDIA_PROVIDER) private readonly mediaProvider: RoomMediaProvider,
  ) {}

  async create(hostId: string, role: Role, dto: CreateRoomDto) {
    const scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : null;
    if (scheduledAt && scheduledAt.getTime() <= Date.now()) {
      throw new BadRequestException('La date planifiée doit être dans le futur.');
    }

    if (dto.contextOrderId) {
      const order = await this.prisma.order.findUnique({
        where: { id: dto.contextOrderId },
        select: { clientId: true, supplierId: true },
      });
      if (!order) throw new NotFoundException('Commande associée introuvable.');
      if (role !== Role.ADMIN && order.clientId !== hostId && order.supplierId !== hostId) {
        throw new ForbiddenException('Vous ne pouvez pas associer cette réunion à cette commande.');
      }
    }

    const token = randomBytes(32).toString('hex');
    const inviteExpiresAt = this.getInviteExpiry();
    const roomCode = `TL-${randomBytes(6).toString('hex').toUpperCase()}`;
    const room = await this.prisma.room.create({
      data: {
        hostId,
        roomCode,
        inviteToken: this.hashInviteToken(token),
        inviteExpiresAt,
        title: dto.title.trim(),
        type: scheduledAt ? RoomType.SCHEDULED : (dto.type ?? RoomType.INSTANT),
        status: scheduledAt ? RoomStatus.SCHEDULED : RoomStatus.WAITING,
        scheduledAt,
        waitingRoomEnabled: dto.waitingRoomEnabled ?? true,
        maxParticipants: dto.maxParticipants ?? 10,
        contextType: dto.contextOrderId ? 'ORDER' : null,
        contextId: dto.contextOrderId ?? null,
        participants: {
          create: {
            userId: hostId,
            participantRole: ParticipantRole.HOST,
            status: ParticipantStatus.ADMITTED,
            joinedAt: new Date(),
          },
        },
      },
      select: {
        id: true,
        roomCode: true,
        title: true,
        type: true,
        status: true,
        scheduledAt: true,
        inviteExpiresAt: true,
        createdAt: true,
      },
    });

    return {
      ...room,
      inviteToken: token,
      inviteLink: this.createInviteLink(token),
    };
  }

  async findMine(userId: string) {
    return this.prisma.room.findMany({
      where: {
        OR: [
          { hostId: userId },
          {
            participants: {
              some: {
                userId,
                status: { in: activeParticipantStatuses },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        roomCode: true,
        title: true,
        type: true,
        status: true,
        scheduledAt: true,
        inviteExpiresAt: true,
        createdAt: true,
        hostId: true,
        host: { select: { id: true, displayName: true } },
        _count: {
          select: {
            participants: { where: { status: ParticipantStatus.ADMITTED } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async findAll() {
    return this.prisma.room.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        scheduledAt: true,
        createdAt: true,
        hostId: true,
        host: { select: { id: true, email: true, displayName: true } },
        _count: {
          select: {
            participants: { where: { status: ParticipantStatus.ADMITTED } },
          },
        },
      },
    });
  }

  async join(userId: string, dto: JoinRoomDto) {
    if (Boolean(dto.roomCode) === Boolean(dto.inviteToken)) {
      throw new BadRequestException('Indiquez un seul code de salle ou lien d’invitation.');
    }

    const room = await this.prisma.room.findFirst({
      where: dto.inviteToken
        ? { inviteToken: this.hashInviteToken(dto.inviteToken) }
        : { roomCode: dto.roomCode!.trim().toUpperCase() },
      select: {
        id: true,
        title: true,
        status: true,
        inviteExpiresAt: true,
        waitingRoomEnabled: true,
        maxParticipants: true,
        hostId: true,
      },
    });
    if (!room) throw new NotFoundException('Code ou lien de salle invalide.');
    if (isTerminalRoomStatus(room.status)) {
      throw new ConflictException('Cette salle est fermée.');
    }
    if (!room.inviteExpiresAt || room.inviteExpiresAt <= new Date()) {
      throw new ConflictException('Ce lien d’invitation a expiré.');
    }

    try {
      const participant = await this.prisma.$transaction(
        async (tx) => {
          const existing = await tx.roomParticipant.findUnique({
            where: { roomId_userId: { roomId: room.id, userId } },
          });
          if (existing?.status === ParticipantStatus.REJECTED) {
            throw new ForbiddenException('Votre demande de participation a été refusée.');
          }
          if (existing?.status === ParticipantStatus.ADMITTED) {
            return existing;
          }

          const status = room.waitingRoomEnabled
            ? ParticipantStatus.WAITING
            : ParticipantStatus.ADMITTED;
          if (status === ParticipantStatus.ADMITTED) {
            const admitted = await tx.roomParticipant.count({
              where: { roomId: room.id, status: ParticipantStatus.ADMITTED },
            });
            if (admitted >= room.maxParticipants) {
              throw new ConflictException('Cette salle a atteint sa capacité maximale.');
            }
          }

          return tx.roomParticipant.upsert({
            where: { roomId_userId: { roomId: room.id, userId } },
            create: {
              roomId: room.id,
              userId,
              participantRole: ParticipantRole.PARTICIPANT,
              status,
              joinedAt: status === ParticipantStatus.ADMITTED ? new Date() : null,
            },
            update: {
              status,
              joinedAt: status === ParticipantStatus.ADMITTED ? new Date() : null,
              leftAt: null,
            },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      return { roomId: room.id, title: room.title, status: participant.status };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
        throw new ConflictException('La salle vient de changer. Réessayez de la rejoindre.');
      }
      throw error;
    }
  }

  async findById(id: string, userId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      select: {
        id: true,
        roomCode: true,
        title: true,
        type: true,
        status: true,
        hostId: true,
        contextType: true,
        contextId: true,
        waitingRoomEnabled: true,
        recordingEnabled: true,
        maxParticipants: true,
        scheduledAt: true,
        startedAt: true,
        endedAt: true,
        notes: true,
        summaryGeneratedAt: true,
        createdAt: true,
        updatedAt: true,
        host: { select: { id: true, displayName: true } },
        participants: {
          where: { status: { in: activeParticipantStatuses } },
          include: { user: { select: { id: true, displayName: true } } },
          orderBy: { joinedAt: 'asc' },
        },
        _count: {
          select: {
            participants: { where: { status: ParticipantStatus.ADMITTED } },
          },
        },
      },
    });
    if (!room) throw new NotFoundException('Salle introuvable.');

    const currentParticipant = room.participants.find((participant) => participant.userId === userId);
    if (!currentParticipant) {
      throw new ForbiddenException('Vous devez rejoindre la salle avec son code ou son lien.');
    }

    const participants = currentParticipant.status === ParticipantStatus.ADMITTED
      ? room.participants
      : room.participants.filter((participant) =>
          participant.userId === userId || participant.participantRole === ParticipantRole.HOST,
        );
    return {
      ...room,
      participants,
      currentParticipantStatus: currentParticipant.status,
      isHost: currentParticipant.participantRole === ParticipantRole.HOST,
    };
  }

  async updateRoom(roomId: string, userId: string, dto: UpdateRoomDto) {
    await this.requireHost(roomId, userId);
    const room = await this.getRoomOrThrow(roomId);
    if (room.status === RoomStatus.LIVE || isTerminalRoomStatus(room.status)) {
      throw new ConflictException('Une réunion en cours ou terminée ne peut plus être modifiée.');
    }
    const scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : undefined;
    if (scheduledAt && scheduledAt.getTime() <= Date.now()) {
      throw new BadRequestException('La date planifiée doit être dans le futur.');
    }
    return this.prisma.room.update({
      where: { id: roomId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(scheduledAt !== undefined ? { scheduledAt, type: RoomType.SCHEDULED, status: RoomStatus.SCHEDULED } : {}),
        ...(dto.maxParticipants !== undefined ? { maxParticipants: dto.maxParticipants } : {}),
        ...(dto.waitingRoomEnabled !== undefined ? { waitingRoomEnabled: dto.waitingRoomEnabled } : {}),
      },
      select: {
        id: true,
        title: true,
        roomCode: true,
        status: true,
        type: true,
        scheduledAt: true,
      },
    });
  }

  async rotateInvite(roomId: string, userId: string) {
    await this.requireHost(roomId, userId);
    const room = await this.getRoomOrThrow(roomId);
    if (isTerminalRoomStatus(room.status)) {
      throw new ConflictException('Impossible de créer une invitation pour une salle fermée.');
    }
    const token = randomBytes(32).toString('hex');
    const inviteExpiresAt = this.getInviteExpiry();
    await this.prisma.room.update({
      where: { id: roomId },
      data: { inviteToken: this.hashInviteToken(token), inviteExpiresAt },
    });
    return {
      roomId,
      roomCode: room.roomCode,
      inviteExpiresAt,
      inviteToken: token,
      inviteLink: this.createInviteLink(token),
    };
  }

  async updateParticipant(
    roomId: string,
    participantId: string,
    actorId: string,
    dto: UpdateParticipantDto,
  ) {
    const actor = await this.requireHostOrModerator(roomId, actorId);
    const room = await this.getRoomOrThrow(roomId);
    if (isTerminalRoomStatus(room.status)) {
      throw new ConflictException('Cette salle est fermée.');
    }
    const participant = await this.prisma.roomParticipant.findFirst({
      where: { id: participantId, roomId },
    });
    if (!participant) throw new NotFoundException('Participant introuvable.');
    if (participant.participantRole === ParticipantRole.HOST) {
      throw new ForbiddenException('Le rôle de l’organisateur ne peut pas être modifié.');
    }
    if (actor.participantRole === ParticipantRole.MODERATOR && dto.action === 'CHANGE_ROLE') {
      throw new ForbiddenException('Seul l’organisateur peut modifier les rôles.');
    }

    if (dto.action === 'CHANGE_ROLE') {
      if (!dto.participantRole) throw new BadRequestException('Le rôle du participant est requis.');
      return this.prisma.roomParticipant.update({
        where: { id: participant.id },
        data: { participantRole: dto.participantRole },
        select: { id: true, userId: true, participantRole: true, status: true },
      });
    }

    if (dto.action === 'ADMIT') {
      try {
        return await this.prisma.$transaction(async (tx) => {
          const admitted = await tx.roomParticipant.count({
            where: { roomId, status: ParticipantStatus.ADMITTED },
          });
          const room = await tx.room.findUniqueOrThrow({
            where: { id: roomId },
            select: { maxParticipants: true },
          });
          if (participant.status !== ParticipantStatus.ADMITTED && admitted >= room.maxParticipants) {
            throw new ConflictException('Cette salle a atteint sa capacité maximale.');
          }
          return tx.roomParticipant.update({
            where: { id: participant.id },
            data: {
              status: ParticipantStatus.ADMITTED,
              joinedAt: new Date(),
              leftAt: null,
            },
            select: { id: true, userId: true, participantRole: true, status: true },
          });
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
          throw new ConflictException('La salle vient de changer. Réessayez.');
        }
        throw error;
      }
    }

    const status = dto.action === 'REJECT' ? ParticipantStatus.REJECTED : ParticipantStatus.LEFT;
    return this.prisma.roomParticipant.update({
      where: { id: participant.id },
      data: {
        status,
        leftAt: status === ParticipantStatus.LEFT ? new Date() : null,
      },
      select: { id: true, userId: true, participantRole: true, status: true },
    });
  }

  async start(roomId: string, hostId: string) {
    await this.requireHost(roomId, hostId);
    const room = await this.getRoomOrThrow(roomId);
    if (isTerminalRoomStatus(room.status)) {
      throw new ConflictException('Cette salle est fermée.');
    }
    if (room.scheduledAt && room.scheduledAt > new Date()) {
      throw new ConflictException('La réunion planifiée ne peut pas commencer avant l’heure prévue.');
    }
    return this.prisma.room.update({
      where: { id: roomId },
      data: {
        status: RoomStatus.LIVE,
        startedAt: room.startedAt ?? new Date(),
      },
      select: { id: true, status: true, startedAt: true },
    });
  }

  async end(roomId: string, hostId: string, status: 'ENDED' | 'CANCELLED') {
    await this.requireHost(roomId, hostId);
    const room = await this.getRoomOrThrow(roomId);
    if (isTerminalRoomStatus(room.status)) return { id: roomId, status: room.status };
    return this.prisma.room.update({
      where: { id: roomId },
      data: {
        status,
        endedAt: new Date(),
        inviteToken: null,
        inviteExpiresAt: new Date(),
      },
      select: { id: true, status: true, endedAt: true },
    });
  }

  async leave(roomId: string, userId: string) {
    const participant = await this.prisma.roomParticipant.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    if (!participant || participant.status !== ParticipantStatus.ADMITTED) {
      throw new ForbiddenException('Vous ne participez pas à cette salle.');
    }
    if (participant.participantRole === ParticipantRole.HOST) {
      throw new ConflictException('L’organisateur doit terminer la réunion pour tous.');
    }
    return this.prisma.roomParticipant.update({
      where: { id: participant.id },
      data: { status: ParticipantStatus.LEFT, leftAt: new Date() },
      select: { id: true, status: true, leftAt: true },
    });
  }

  async getMediaToken(roomId: string, userId: string) {
    const participant = await this.requireAdmitted(roomId, userId);
    const room = await this.getRoomOrThrow(roomId);
    if (isTerminalRoomStatus(room.status)) {
      throw new ConflictException('Cette salle est fermée.');
    }
    if (room.status !== RoomStatus.LIVE) {
      throw new ConflictException('L’organisateur doit démarrer la réunion avant la connexion média.');
    }
    return this.mediaProvider.createJoinToken(
      roomId,
      userId,
      this.getDisplayName(participant.user.displayName, userId),
    );
  }

  async getMessages(roomId: string, userId: string, page = 1, limit = 50) {
    await this.requireAdmitted(roomId, userId);
    const skip = (page - 1) * limit;
    const where = { roomId };
    const [data, total] = await Promise.all([
      this.prisma.roomChatMessage.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sentAt: 'desc' },
        include: { sender: { select: { id: true, displayName: true } } },
      }),
      this.prisma.roomChatMessage.count({ where }),
    ]);
    return {
      data: data.reverse(),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async createMessage(roomId: string, userId: string, message: string) {
    await this.requireAdmitted(roomId, userId);
    const room = await this.getRoomOrThrow(roomId);
    if (isTerminalRoomStatus(room.status)) {
      throw new ConflictException('Le chat de cette salle est fermé.');
    }
    return this.prisma.roomChatMessage.create({
      data: { roomId, senderId: userId, message: message.trim() },
      include: { sender: { select: { id: true, displayName: true } } },
    });
  }

  async updateNotes(roomId: string, userId: string, notes: string) {
    await this.requireHostOrModerator(roomId, userId);
    const room = await this.getRoomOrThrow(roomId);
    if (isTerminalRoomStatus(room.status)) {
      throw new ConflictException('Les notes d’une salle fermée ne peuvent plus être modifiées.');
    }
    return this.prisma.room.update({
      where: { id: roomId },
      data: { notes },
      select: { id: true, notes: true, updatedAt: true },
    });
  }

  private async requireAdmitted(roomId: string, userId: string) {
    const participant = await this.prisma.roomParticipant.findUnique({
      where: { roomId_userId: { roomId, userId } },
      include: { user: { select: { displayName: true } } },
    });
    if (!participant || participant.status !== ParticipantStatus.ADMITTED) {
      throw new ForbiddenException('Vous devez être admis dans cette salle.');
    }
    return participant;
  }

  private async requireHost(roomId: string, userId: string) {
    const participant = await this.prisma.roomParticipant.findUnique({
      where: { roomId_userId: { roomId, userId } },
      select: { participantRole: true },
    });
    if (participant?.participantRole !== ParticipantRole.HOST) {
      throw new ForbiddenException('Seul l’organisateur peut effectuer cette action.');
    }
  }

  private async requireHostOrModerator(roomId: string, userId: string) {
    const participant = await this.prisma.roomParticipant.findUnique({
      where: { roomId_userId: { roomId, userId } },
      select: { participantRole: true, status: true },
    });
    if (
      !participant ||
      participant.status !== ParticipantStatus.ADMITTED ||
      (participant.participantRole !== ParticipantRole.HOST &&
        participant.participantRole !== ParticipantRole.MODERATOR)
    ) {
      throw new ForbiddenException('Organisateur ou modérateur requis.');
    }
    return participant;
  }

  private async getRoomOrThrow(roomId: string) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Salle introuvable.');
    return room;
  }

  private getInviteExpiry() {
    const days = Number(this.config.get('ROOM_INVITE_TTL_DAYS', '30'));
    if (!Number.isInteger(days) || days < 1 || days > 90) {
      throw new ServiceUnavailableException('ROOM_INVITE_TTL_DAYS doit être compris entre 1 et 90.');
    }
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  private createInviteLink(token: string) {
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    return `${frontendUrl.replace(/\/$/, '')}/dashboard/rooms/join?invite=${token}`;
  }

  private hashInviteToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private getDisplayName(value: Prisma.JsonValue, userId: string) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const localized = value.fr ?? value.en ?? value.ar;
      if (typeof localized === 'string' && localized.trim()) return localized.trim();
    }
    return `Participant ${userId.slice(0, 8)}`;
  }
}
