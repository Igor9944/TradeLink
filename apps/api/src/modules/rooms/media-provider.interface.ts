export const ROOM_MEDIA_PROVIDER = Symbol('ROOM_MEDIA_PROVIDER');

export interface RoomMediaProvider {
  createJoinToken(roomId: string, userId: string, displayName: string): Promise<{
    url: string;
    token: string;
    expiresIn: number;
  }>;
}
