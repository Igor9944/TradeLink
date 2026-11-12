import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';
import { KycScheduler } from './kyc.scheduler';
import { EmailsModule } from '../emails/emails.module';
import { SmsModule } from '../sms/sms.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads/kyc',
        filename: (_, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `kyc-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_, file, cb) => {
        const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
        const ext = extname(file.originalname).toLowerCase();
        const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!allowed.includes(ext) || !allowedMimeTypes.includes(file.mimetype)) {
          cb(new BadRequestException('Type de fichier KYC non autorisé'), false);
          return;
        }
        cb(null, true);
      },
    }),
    EmailsModule,
    SmsModule,
    WhatsAppModule,
  ],
  controllers: [KycController],
  providers: [KycService, KycScheduler],
  exports: [KycService],
})
export class KycModule {}
