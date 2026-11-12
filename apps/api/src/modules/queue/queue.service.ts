import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue('emails') private emailQueue: Queue,
    @InjectQueue('sms') private smsQueue: Queue,
    @InjectQueue('whatsapp') private whatsappQueue: Queue,
    @InjectQueue('pdf') private pdfQueue: Queue,
    @InjectQueue('kyc-reminders') private kycQueue: Queue,
  ) {}

  /**
   * Ajouter un job d'envoi d'email
   */
  async sendEmail(data: {
    to: string;
    template: string;
    lang: string;
    params: Record<string, any>;
  }) {
    return this.emailQueue.add('send-email', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }

  /**
   * Ajouter un job d'envoi de SMS
   */
  async sendSMS(data: {
    to: string;
    message: string;
  }) {
    return this.smsQueue.add('send-sms', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });
  }

  /**
   * Ajouter un job d'envoi WhatsApp
   */
  async sendWhatsApp(data: {
    to: string;
    template: string;
    params: any[];
  }) {
    return this.whatsappQueue.add('send-whatsapp', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }

  /**
   * Ajouter un job de génération PDF
   */
  async generatePDF(data: {
    type: 'invoice' | 'order' | 'shipment';
    id: string;
    lang: string;
  }) {
    return this.pdfQueue.add('generate-pdf', data, {
      attempts: 2,
    });
  }

  /**
   * Programmer une relance KYC
   */
  async scheduleKycReminder(data: {
    userId: string;
    day: number; // 1, 3, 5, ou 7
  }) {
    const delay = data.day * 24 * 60 * 60 * 1000; // Convertir jours en millisecondes
    
    return this.kycQueue.add('kyc-reminder', data, {
      delay,
      attempts: 2,
    });
  }

  /**
   * Récupérer les statistiques des queues
   */
  async getQueueStats() {
    const [emailStats, smsStats, whatsappStats, pdfStats, kycStats] = await Promise.all([
      this.getStats(this.emailQueue),
      this.getStats(this.smsQueue),
      this.getStats(this.whatsappQueue),
      this.getStats(this.pdfQueue),
      this.getStats(this.kycQueue),
    ]);

    return {
      emails: emailStats,
      sms: smsStats,
      whatsapp: whatsappStats,
      pdf: pdfStats,
      kycReminders: kycStats,
    };
  }

  private async getStats(queue: Queue) {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }
}
