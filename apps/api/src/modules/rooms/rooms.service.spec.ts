import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ParticipantRole, ParticipantStatus, Role, RoomStatus, RoomType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { LiveKitMediaProvider } from './livekit-media.provider';
import { RoomsService } from './rooms.service';

function createConfig() {
  return {
    get: jest.fn((key: string, defaultValue?: string) => {
      if (key === 'FRONTEND_URL') return 'https://app.example.test';
      if (key === 'NODE_ENV') return 'test';
      return defaultValue;
    }),
  };
}

describe('RoomsService invitations and access', () => {
  it('creates a high-entropy private invite, stores only its hash, and admits the host', async () => {
    let persistedRoomData: Record<string, unknown> | undefined;
    const prisma = {
      room: {
        create: jest.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => {
          persistedRoomData = data;
          return {
            id: 'room-1',
            roomCode: data.roomCode,
            title: data.title,
            type: data.type,
            status: data.status,
            scheduledAt: null,
            inviteExpiresAt: data.inviteExpiresAt,
            createdAt: new Date(),
          };
        }),
      },
      order: { findUnique: jest.fn() },
    };
    const service = new RoomsService(
      prisma as unknown as PrismaService,
      createConfig() as unknown as ConfigService,
      {} as LiveKitMediaProvider,
    );

    const result = await service.create('host-1', Role.CLIENT, { title: 'Private meeting' });

    expect(result.roomCode).toMatch(/^TL-[A-F0-9]{12}$/);
    expect(result.inviteToken).toMatch(/^[a-f0-9]{64}$/);
    expect(result.inviteLink).toBe(`https://app.example.test/dashboard/rooms/join?invite=${result.inviteToken}`);
    expect(persistedRoomData?.inviteToken).not.toBe(result.inviteToken);
    expect(persistedRoomData?.status).toBe(RoomStatus.WAITING);
    expect(persistedRoomData?.type).toBe(RoomType.INSTANT);
    expect(persistedRoomData?.participants).toEqual({
      create: {
        userId: 'host-1',
        participantRole: ParticipantRole.HOST,
        status: ParticipantStatus.ADMITTED,
        joinedAt: expect.any(Date),
      },
    });
  });

  it('requires exactly one invitation credential', async () => {
    const service = new RoomsService(
      {} as PrismaService,
      createConfig() as unknown as ConfigService,
      {} as LiveKitMediaProvider,
    );

    await expect(service.join('guest-1', {})).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.join('guest-1', { roomCode: 'TL-AAAAAAAAAAAA', inviteToken: 'a'.repeat(64) }))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it('queues an invited attendee for host approval when the waiting room is enabled', async () => {
    const tx = {
      roomParticipant: {
        findUnique: jest.fn().mockResolvedValue(null),
        count: jest.fn(),
        upsert: jest.fn().mockResolvedValue({ status: ParticipantStatus.WAITING }),
      },
    };
    const prisma = {
      room: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'room-1',
          title: 'Meeting',
          status: RoomStatus.WAITING,
          inviteExpiresAt: new Date(Date.now() + 60_000),
          waitingRoomEnabled: true,
          maxParticipants: 10,
          hostId: 'host-1',
        }),
      },
      $transaction: jest.fn(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx)),
    };
    const service = new RoomsService(
      prisma as unknown as PrismaService,
      createConfig() as unknown as ConfigService,
      {} as LiveKitMediaProvider,
    );

    const result = await service.join('guest-1', { roomCode: 'tl-aaaaaaaaaaaa' });

    expect(result.status).toBe(ParticipantStatus.WAITING);
    expect(prisma.room.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { roomCode: 'TL-AAAAAAAAAAAA' } }),
    );
    expect(tx.roomParticipant.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ userId: 'guest-1', status: ParticipantStatus.WAITING }),
    }));
    expect(tx.roomParticipant.count).not.toHaveBeenCalled();
  });

  it('rejects expired invitation codes before creating a participant', async () => {
    const prisma = {
      room: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'room-1',
          title: 'Meeting',
          status: RoomStatus.WAITING,
          inviteExpiresAt: new Date(Date.now() - 60_000),
          waitingRoomEnabled: true,
          maxParticipants: 10,
          hostId: 'host-1',
        }),
      },
      $transaction: jest.fn(),
    };
    const service = new RoomsService(
      prisma as unknown as PrismaService,
      createConfig() as unknown as ConfigService,
      {} as LiveKitMediaProvider,
    );

    await expect(service.join('guest-1', { roomCode: 'TL-AAAAAAAAAAAA' }))
      .rejects.toBeInstanceOf(ConflictException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('does not issue media tokens to attendees still waiting for admission', async () => {
    const mediaProvider = { createJoinToken: jest.fn() };
    const prisma = {
      roomParticipant: {
        findUnique: jest.fn().mockResolvedValue({ status: ParticipantStatus.WAITING }),
      },
    };
    const service = new RoomsService(
      prisma as unknown as PrismaService,
      createConfig() as unknown as ConfigService,
      mediaProvider as unknown as LiveKitMediaProvider,
    );

    await expect(service.getMediaToken('room-1', 'guest-1')).rejects.toBeInstanceOf(ForbiddenException);
    expect(mediaProvider.createJoinToken).not.toHaveBeenCalled();
  });

  it('does not admit a participant when the room has reached its capacity', async () => {
    const tx = {
      roomParticipant: { count: jest.fn().mockResolvedValue(10) },
      room: { findUniqueOrThrow: jest.fn().mockResolvedValue({ maxParticipants: 10 }) },
    };
    const prisma = {
      roomParticipant: {
        findUnique: jest.fn().mockResolvedValue({
          participantRole: ParticipantRole.HOST,
          status: ParticipantStatus.ADMITTED,
        }),
        findFirst: jest.fn().mockResolvedValue({
          id: 'participant-2',
          status: ParticipantStatus.WAITING,
          participantRole: ParticipantRole.PARTICIPANT,
        }),
      },
      room: { findUnique: jest.fn().mockResolvedValue({ status: RoomStatus.WAITING }) },
      $transaction: jest.fn(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx)),
    };
    const service = new RoomsService(
      prisma as unknown as PrismaService,
      createConfig() as unknown as ConfigService,
      {} as LiveKitMediaProvider,
    );

    await expect(service.updateParticipant('room-1', 'participant-2', 'host-1', { action: 'ADMIT' }))
      .rejects.toBeInstanceOf(ConflictException);
  });

  it('allows the host to change an admitted participant role', async () => {
    const prisma = {
      roomParticipant: {
        findUnique: jest.fn().mockResolvedValue({
          participantRole: ParticipantRole.HOST,
          status: ParticipantStatus.ADMITTED,
        }),
        findFirst: jest.fn().mockResolvedValue({
          id: 'participant-2',
          status: ParticipantStatus.ADMITTED,
          participantRole: ParticipantRole.PARTICIPANT,
        }),
        update: jest.fn().mockResolvedValue({
          id: 'participant-2',
          userId: 'user-2',
          participantRole: ParticipantRole.MODERATOR,
          status: ParticipantStatus.ADMITTED,
        }),
      },
      room: { findUnique: jest.fn().mockResolvedValue({ status: RoomStatus.WAITING }) },
    };
    const service = new RoomsService(
      prisma as unknown as PrismaService,
      createConfig() as unknown as ConfigService,
      {} as LiveKitMediaProvider,
    );

    await expect(service.updateParticipant('room-1', 'participant-2', 'host-1', {
      action: 'CHANGE_ROLE',
      participantRole: 'MODERATOR',
    })).resolves.toMatchObject({ participantRole: ParticipantRole.MODERATOR });
    expect(prisma.roomParticipant.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { participantRole: ParticipantRole.MODERATOR },
    }));
  });

  it('prevents moderators from changing participant roles', async () => {
    const prisma = {
      roomParticipant: {
        findUnique: jest.fn().mockResolvedValue({
          participantRole: ParticipantRole.MODERATOR,
          status: ParticipantStatus.ADMITTED,
        }),
        findFirst: jest.fn().mockResolvedValue({
          id: 'participant-2',
          status: ParticipantStatus.ADMITTED,
          participantRole: ParticipantRole.PARTICIPANT,
        }),
        update: jest.fn(),
      },
      room: { findUnique: jest.fn().mockResolvedValue({ status: RoomStatus.WAITING }) },
    };
    const service = new RoomsService(
      prisma as unknown as PrismaService,
      createConfig() as unknown as ConfigService,
      {} as LiveKitMediaProvider,
    );

    await expect(service.updateParticipant('room-1', 'participant-2', 'moderator-1', {
      action: 'CHANGE_ROLE',
      participantRole: 'MODERATOR',
    })).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.roomParticipant.update).not.toHaveBeenCalled();
  });
});
