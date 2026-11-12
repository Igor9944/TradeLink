import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueService } from './queue.service';
import { EmailProcessor } from './processors/email.processor';
import { SmsProcessor } from './processors/sms.processor';
import { WhatsAppProcessor } from './processors/whatsapp.processor';
import { PdfProcessor } from './processors/pdf.processor';
import { EmailsModule } from '../emails/emails.module';
import { SmsModule } from '../sms/sms.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { PdfModule } from '../pdf/pdf.module';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST') || 'localhost',
          port: configService.get('REDIS_PORT') || 6379,
          password: configService.get('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: 'emails' },
      { name: 'sms' },
      { name: 'whatsapp' },
      { name: 'pdf' },
      { name: 'kyc-reminders' },
    ),
    EmailsModule,
    SmsModule,
    WhatsAppModule,
    PdfModule,
  ],
  providers: [
    QueueService,
    EmailProcessor,
    SmsProcessor,
    WhatsAppProcessor,
    PdfProcessor,
  ],
  exports: [QueueService, BullModule],
})
export class QueueModule {}
