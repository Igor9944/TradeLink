import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessToken } from 'livekit-server-sdk';
import type { RoomMediaProvider } from './media-provider.interface';

@Injectable()
export class LiveKitMediaProvider implements RoomMediaProvider {
  constructor(private readonly config: ConfigService) {}

  async createJoinToken(roomId: string, userId: string, displayName: string) {
    const url = this.config.get<string>('LIVEKIT_URL');
    const apiKey = this.config.get<string>('LIVEKIT_API_KEY');
    const apiSecret = this.config.get<string>('LIVEKIT_API_SECRET');
    if (!url || !apiKey || !apiSecret) {
      throw new ServiceUnavailableException('Le service vidéo Room Live n’est pas configuré.');
    }

    let endpoint: URL;
    try {
      endpoint = new URL(url);
    } catch {
      throw new ServiceUnavailableException('L’adresse du service vidéo Room Live est invalide.');
    }
    if (endpoint.protocol !== 'ws:' && endpoint.protocol !== 'wss:') {
      throw new ServiceUnavailableException('L’adresse du service vidéo doit utiliser WebSocket sécurisé.');
    }
    if (this.config.get<string>('NODE_ENV') === 'production' && endpoint.protocol !== 'wss:') {
      throw new ServiceUnavailableException('Room Live exige une adresse WSS en production.');
    }

    const accessToken = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      name: displayName,
      ttl: 600,
    });
    accessToken.addGrant({
      roomJoin: true,
      room: roomId,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    return {
      url,
      token: await accessToken.toJwt(),
      expiresIn: 600,
    };
  }
}
