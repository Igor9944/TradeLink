import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { BrevoService } from '../../emails/brevo.service';

@Processor('emails')
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private brevoService: BrevoService) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.log(`Processing email job ${job.id}: ${job.name}`);

    try {
      switch (job.name) {
        case 'send-email':
          return await this.sendEmail(job.data);
        default:
          throw new Error(`Unknown job name: ${job.name}`);
      }
    } catch (error) {
      this.logger.error(`Email job ${job.id} failed: ${error.message}`);
      throw error;
    }
  }

  private async sendEmail(data: any) {
    this.logger.log(`Sending email to ${data.to} with template ${data.template}`);
    
    const result = await this.brevoService.sendEmail({
      to: data.to,
      toName: data.params?.firstName,
      template: data.template,
      lang: data.lang,
      params: data.params,
    });
    
    return { success: true, messageId: result.messageId };
  }
}
