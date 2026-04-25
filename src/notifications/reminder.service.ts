import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // Corre todos los días a las 8 PM (hora Peru UTC-5 = 01:00 UTC)
  @Cron('0 1 * * *')
  async sendTomorrowReminders() {
    this.logger.log('Running appointment reminders cron job...');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const appointments = await this.prisma.appointment.findMany({
      where: {
        appointmentDate: tomorrowStr,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      include: {
        user: { select: { fcmToken: true, firstName: true } },
        doctor: { select: { firstName: true, lastName: true } },
      },
    });

    let sent = 0;
    for (const apt of appointments) {
      if (!apt.user.fcmToken) continue;
      await this.notifications.sendToToken(
        apt.user.fcmToken,
        '🏥 Recordatorio de cita mañana',
        `Hola ${apt.user.firstName}, tienes cita mañana a las ${apt.appointmentTime} con Dr. ${apt.doctor.firstName} ${apt.doctor.lastName}. ¡No olvides asistir!`,
      ).catch(() => {});
      sent++;
    }

    this.logger.log(`Reminders sent: ${sent}/${appointments.length}`);
  }
}
