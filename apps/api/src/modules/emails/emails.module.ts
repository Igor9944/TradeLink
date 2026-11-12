import { Module } from '@nestjs/common';
import { BrevoService } from './brevo.service';
import { EmailsController } from './emails.controller';

@Module({
  controllers: [EmailsController],
  providers: [BrevoService],
  exports: [BrevoService],
})
export class EmailsModule {}
