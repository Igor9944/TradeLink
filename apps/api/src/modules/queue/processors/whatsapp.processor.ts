import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { WhatsAppService } from '../../whatsapp/whatsapp.service';

@Processor('whatsapp')
export class WhatsAppProcessor extends WorkerHost {
  private readonly logger = new Logger(WhatsAppProcessor.name);

  constructor(private whatsappService: WhatsAppService) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.log(`Processing WhatsApp job ${job.id}: ${job.name}`);

    try {
      switch (job.name) {
        case 'send-whatsapp':
          return await this.sendWhatsApp(job.data);
        default:
          throw new Error(`Unknown job name: ${job.name}`);
      }
    } catch (error) {
      this.logger.error(`WhatsApp job ${job.id} failed: ${error.message}`);
      throw error;
    }
  }

  private async sendWhatsApp(data: any) {
    this.logger.log(`Sending WhatsApp to ${data.to} with template ${data.template}`);
    
    const result = await this.whatsappService.sendMessage({
      to: data.to,
      template: data.template,
      params: data.params,
      lang: data.lang,
    });
    
    return { success: true, messageId: result.messageId };
  }
}
