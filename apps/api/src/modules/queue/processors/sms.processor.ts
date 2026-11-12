import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SmsService } from '../../sms/sms.service';

@Processor('sms')
export class SmsProcessor extends WorkerHost {
  private readonly logger = new Logger(SmsProcessor.name);

  constructor(private smsService: SmsService) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.log(`Processing SMS job ${job.id}: ${job.name}`);

    try {
      switch (job.name) {
        case 'send-sms':
          return await this.sendSMS(job.data);
        default:
          throw new Error(`Unknown job name: ${job.name}`);
      }
    } catch (error) {
      this.logger.error(`SMS job ${job.id} failed: ${error.message}`);
      throw error;
    }
  }

  private async sendSMS(data: any) {
    this.logger.log(`Sending SMS to ${data.to}`);
    
    const result = await this.smsService.sendSMS({
      to: data.to,
      message: data.message,
    });
    
    return { success: true, messageId: result.messageId };
  }
}
