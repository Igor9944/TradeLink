import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TokenVerifier } from 'livekit-server-sdk';
import { LiveKitMediaProvider } from './livekit-media.provider';

describe('LiveKitMediaProvider', () => {
  const credentials = {
    LIVEKIT_URL: 'wss://media.example.test',
    LIVEKIT_API_KEY: 'test-key',
    LIVEKIT_API_SECRET: 'test-secret-with-sufficient-length',
    NODE_ENV: 'test',
  };

  function provider(values: Record<string, string>) {
    const config = {
      get: jest.fn((key: string) => values[key]),
    };
    return new LiveKitMediaProvider(config as unknown as ConfigService);
  }

  it('issues a short-lived token scoped to one room and one participant identity', async () => {
    const mediaProvider = provider(credentials);
    const result = await mediaProvider.createJoinToken('room-1', 'user-1', 'A participant');
    const claims = await new TokenVerifier(
      credentials.LIVEKIT_API_KEY,
      credentials.LIVEKIT_API_SECRET,
    ).verify(result.token);

    expect(result.url).toBe(credentials.LIVEKIT_URL);
    expect(result.expiresIn).toBe(600);
    expect(claims.sub).toBe('user-1');
    expect(claims.video).toMatchObject({
      roomJoin: true,
      room: 'room-1',
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });
  });

  it('does not silently fall back when LiveKit credentials are missing', async () => {
    await expect(provider({}).createJoinToken('room-1', 'user-1', 'Guest'))
      .rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('requires WSS for production media endpoints', async () => {
    await expect(provider({
      ...credentials,
      LIVEKIT_URL: 'ws://media.example.test',
      NODE_ENV: 'production',
    }).createJoinToken('room-1', 'user-1', 'Guest'))
      .rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
