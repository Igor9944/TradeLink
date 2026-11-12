import { Module } from '@nestjs/common';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { LiveKitMediaProvider } from './livekit-media.provider';
import { ROOM_MEDIA_PROVIDER } from './media-provider.interface';

@Module({
  controllers: [RoomsController],
  providers: [
    RoomsService,
    LiveKitMediaProvider,
    { provide: ROOM_MEDIA_PROVIDER, useExisting: LiveKitMediaProvider },
  ],
})
export class RoomsModule {}
