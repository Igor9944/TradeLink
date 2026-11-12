import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { UserStatus } from '@prisma/client';

interface KycReminderStats {
  day1: number;
  day3: number;
  day5: number;
  day7: number;
}

@Injectable()
export class KycScheduler {
  private readonly logger = new Logger(KycScheduler.name);

  constructor(
    private prisma: PrismaService,
    private queueService: QueueService,
  ) {}

  /**
   * Job CRON : Relances KYC automatiques
   * Exécuté tous les jours à 9h du matin
   */
  @Cron('0 9 * * *', {
    name: 'kyc-reminders',
    timeZone: 'Africa/Tunis',
  })
  async handleKycReminders() {
    this.logger.log('🔔 Starting KYC reminders job...');

    const stats: KycReminderStats = {
      day1: 0,
      day3: 0,
      day5: 0,
      day7: 0,
    };

    try {
      // J+1 (6 jours restants)
      await this.sendRemindersForDay('day1', 1, 6, stats);

      // J+3 (4 jours restants)
      await this.sendRemindersForDay('day3', 3, 4, stats);

      // J+5 (2 jours restants)
      await this.sendRemindersForDay('day5', 5, 2, stats);

      // J+7 (0 jours - Suspension automatique)
      await this.suspendAccountsAtDay7(stats);

      this.logger.log(
        `✅ KYC reminders job completed: ` +
        `Day1=${stats.day1}, Day3=${stats.day3}, Day5=${stats.day5}, Suspended=${stats.day7}`
      );
    } catch (error) {
      this.logger.error(`❌ KYC reminders job failed: ${error.message}`, error.stack);
    }
  }

  /**
   * Envoyer des relances pour un jour spécifique
   */
  private async sendRemindersForDay(
    statKey: 'day1' | 'day3' | 'day5',
    daysSinceRegistration: number,
    daysLeft: number,
    stats: KycReminderStats,
  ) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - daysSinceRegistration);
    targetDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const users = await this.prisma.user.findMany({
      where: {
        status: UserStatus.PENDING_KYC,
        createdAt: {
          gte: targetDate,
          lt: nextDay,
        },
      },
    });

    this.logger.log(`Found ${users.length} users for Day ${daysSinceRegistration} reminder`);

    for (const user of users) {
      try {
        const firstName = this.getDisplayName(user.displayName, user.preferredLang);

        // Email via queue
        await this.queueService.sendEmail({
          to: user.email,
          template: `kyc-reminder-day-${daysSinceRegistration}`,
          lang: user.preferredLang,
          params: {
            firstName,
            daysLeft,
          },
        });

        // SMS si numéro renseigné
        if (user.phone) {
          await this.queueService.sendSMS({
            to: user.phone,
            message: this.getSmsMessage(user.preferredLang, daysLeft),
          });
        }

        stats[statKey]++;
      } catch (error) {
        this.logger.error(
          `Failed to send reminder to user ${user.id}: ${error.message}`
        );
      }
    }
  }

  /**
   * Suspendre les comptes à J+7
   */
  private async suspendAccountsAtDay7(stats: any) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const eightDaysAgo = new Date(sevenDaysAgo);
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 1);

    const usersToSuspend = await this.prisma.user.findMany({
      where: {
        status: UserStatus.PENDING_KYC,
        createdAt: {
          gte: eightDaysAgo,
          lt: sevenDaysAgo,
        },
      },
    });

    this.logger.warn(`Found ${usersToSuspend.length} users to suspend for KYC deadline`);

    for (const user of usersToSuspend) {
      try {
        // Suspendre le compte
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            status: UserStatus.SUSPENDED,
          },
        });

        const firstName = this.getDisplayName(user.displayName, user.preferredLang);

        // Email de notification
        await this.queueService.sendEmail({
          to: user.email,
          template: 'account-suspended-kyc',
          lang: user.preferredLang,
          params: {
            firstName,
          },
        });

        // SMS
        if (user.phone) {
          await this.queueService.sendSMS({
            to: user.phone,
            message: this.getSuspensionSmsMessage(user.preferredLang),
          });
        }

        // Log d'audit
        await this.prisma.auditLog.create({
          data: {
            action: 'ACCOUNT_SUSPENDED',
            actorId: 'SYSTEM',
            targetId: user.id,
            ipAddress: '0.0.0.0',
            userAgent: 'CRON Job',
            metadata: {
              reason: 'KYC_DEADLINE_EXCEEDED',
              daysAfterRegistration: 7,
            },
          },
        });

        stats.day7++;
        this.logger.warn(`Suspended user ${user.id} (${user.email}) for KYC deadline`);
      } catch (error) {
        this.logger.error(
          `Failed to suspend user ${user.id}: ${error.message}`
        );
      }
    }
  }

  /**
   * Extraire le prénom du displayName JSON
   */
  private getDisplayName(displayName: any, lang: string): string {
    if (!displayName) return 'Utilisateur';

    try {
      const parsed = typeof displayName === 'string' 
        ? JSON.parse(displayName) 
        : displayName;
      return parsed[lang] || parsed['fr'] || 'Utilisateur';
    } catch {
      return 'Utilisateur';
    }
  }

  /**
   * Message SMS de relance selon la langue
   */
  private getSmsMessage(lang: string, daysLeft: number): string {
    const messages = {
      fr: `TradeLink: Il vous reste ${daysLeft} jours pour soumettre vos documents KYC. https://tradelink.com/kyc`,
      en: `TradeLink: You have ${daysLeft} days left to submit your KYC documents. https://tradelink.com/kyc`,
      ar: `TradeLink: لديك ${daysLeft} أيام متبقية لتقديم وثائق KYC. https://tradelink.com/kyc`,
    };
    return messages[lang] || messages['fr'];
  }

  /**
   * Message SMS de suspension selon la langue
   */
  private getSuspensionSmsMessage(lang: string): string {
    const messages = {
      fr: 'TradeLink: Votre compte a été suspendu pour non-soumission KYC. Contactez support@tradelink.com',
      en: 'TradeLink: Your account has been suspended for KYC non-submission. Contact support@tradelink.com',
      ar: 'TradeLink: تم تعليق حسابك لعدم تقديم KYC. اتصل support@tradelink.com',
    };
    return messages[lang] || messages['fr'];
  }

  /**
   * Job manuel pour tester les relances (à utiliser en dev)
   */
  async testReminders() {
    this.logger.log('🧪 Running manual KYC reminders test...');
    await this.handleKycReminders();
  }
}
