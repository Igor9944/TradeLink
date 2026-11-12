import { Module } from '@nestjs/common';
import { FloatingButtonsController } from './floating-buttons.controller';
import { FloatingButtonsService } from './floating-buttons.service';

@Module({
  controllers: [FloatingButtonsController],
  providers: [FloatingButtonsService],
})
export class FloatingButtonsModule {}
