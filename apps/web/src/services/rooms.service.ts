import api from '@/lib/api'

export type RoomStatus = 'SCHEDULED' | 'WAITING' | 'LIVE' | 'ENDED' | 'CANCELLED'
export type ParticipantStatus = 'WAITING' | 'ADMITTED' | 'REJECTED' | 'LEFT'
export type ParticipantRole = 'HOST' | 'MODERATOR' | 'PARTICIPANT'

export interface LiveRoom {
  id: string
  roomCode: string
  title: string
  type: 'INSTANT' | 'SCHEDULED'
  status: RoomStatus
  scheduledAt: string | null
  inviteExpiresAt?: string | null
  createdAt: string
  hostId?: string
  host: { id: string; email?: string | null; displayName: string | Record<string, string> | null }
  _count: { participants: number }
}

export interface RoomParticipant {
  id: string
  userId: string
  participantRole: ParticipantRole
  status: ParticipantStatus
  joinedAt: string | null
  user: { id: string; displayName: string | Record<string, string> | null }
}

export interface RoomDetails extends LiveRoom {
  hostId: string
  host: { id: string; displayName: string | Record<string, string> | null }
  participants: RoomParticipant[]
  currentParticipantStatus: ParticipantStatus
  isHost: boolean
  waitingRoomEnabled: boolean
  maxParticipants: number
  notes: string | null
}

export interface RoomInvite {
  roomId: string
  roomCode: string
  inviteExpiresAt: string
  inviteToken: string
  inviteLink: string
}

export interface RoomMessage {
  id: string
  message: string
  sentAt: string
  senderId: string
  sender: { id: string; displayName: string | Record<string, string> | null }
}

export interface RoomMediaToken {
  url: string
  token: string
  expiresIn: number
}

export const roomsService = {
  getAll: async (): Promise<LiveRoom[]> => {
    const response = await api.get<LiveRoom[]>('/rooms')
    return response.data
  },

  create: async (input: {
    title: string
    scheduledAt?: string
    waitingRoomEnabled?: boolean
    maxParticipants?: number
    contextOrderId?: string
  }): Promise<LiveRoom & RoomInvite> => {
    const response = await api.post<LiveRoom & RoomInvite>('/rooms', input)
    return response.data
  },

  join: async (input: { roomCode?: string; inviteToken?: string }) => {
    const response = await api.post<{ roomId: string; title: string; status: ParticipantStatus }>('/rooms/join', input)
    return response.data
  },

  getById: async (roomId: string): Promise<RoomDetails> => {
    const response = await api.get<RoomDetails>(`/rooms/${roomId}`)
    return response.data
  },

  update: async (roomId: string, input: { title?: string; scheduledAt?: string; maxParticipants?: number; waitingRoomEnabled?: boolean }) => {
    const response = await api.patch(`/rooms/${roomId}`, input)
    return response.data
  },

  rotateInvite: async (roomId: string): Promise<RoomInvite> => {
    const response = await api.post<RoomInvite>(`/rooms/${roomId}/invitations/rotate`)
    return response.data
  },

  updateParticipant: async (
    roomId: string,
    participantId: string,
    input: { action: 'ADMIT' | 'REJECT' | 'REMOVE' | 'CHANGE_ROLE'; participantRole?: 'MODERATOR' | 'PARTICIPANT' },
  ) => {
    const response = await api.patch(`/rooms/${roomId}/participants/${participantId}`, input)
    return response.data
  },

  start: async (roomId: string) => {
    const response = await api.post(`/rooms/${roomId}/start`)
    return response.data
  },

  end: async (roomId: string) => {
    const response = await api.post(`/rooms/${roomId}/end`)
    return response.data
  },

  cancel: async (roomId: string) => {
    const response = await api.delete(`/rooms/${roomId}`)
    return response.data
  },

  leave: async (roomId: string) => {
    const response = await api.post(`/rooms/${roomId}/leave`)
    return response.data
  },

  getMediaToken: async (roomId: string): Promise<RoomMediaToken> => {
    const response = await api.post<RoomMediaToken>(`/rooms/${roomId}/media-token`)
    return response.data
  },

  getMessages: async (roomId: string): Promise<{ data: RoomMessage[] }> => {
    const response = await api.get<{ data: RoomMessage[] }>(`/rooms/${roomId}/messages`, {
      params: { page: 1, limit: 50 },
    })
    return response.data
  },

  sendMessage: async (roomId: string, message: string): Promise<RoomMessage> => {
    const response = await api.post<RoomMessage>(`/rooms/${roomId}/messages`, { message })
    return response.data
  },

  updateNotes: async (roomId: string, notes: string) => {
    const response = await api.patch(`/rooms/${roomId}/notes`, { notes })
    return response.data
  },
}
