import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class WaitlistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async join(userId: string, doctorId: string, date: string, time: string) {
    const existing = await this.prisma.waitlistEntry.findUnique({
      where: { userId_doctorId_date_time: { userId, doctorId, date, time } },
    });
    if (existing) throw new ConflictException('Ya estás en la lista de espera para este horario');

    return this.prisma.waitlistEntry.create({
      data: { userId, doctorId, date, time },
      include: { doctor: { select: { firstName: true, lastName: true } } },
    });
  }

  async getMy(userId: string) {
    return this.prisma.waitlistEntry.findMany({
      where: { userId },
      include: {
        doctor: { select: { id: true, firstName: true, lastName: true, specialtyId: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async leave(userId: string, id: string) {
    const entry = await this.prisma.waitlistEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Entrada no encontrada');
    if (entry.userId !== userId) throw new ForbiddenException();
    await this.prisma.waitlistEntry.delete({ where: { id } });
    return { success: true };
  }

  async isOnWaitlist(userId: string, doctorId: string, date: string, time: string) {
    const entry = await this.prisma.waitlistEntry.findUnique({
      where: { userId_doctorId_date_time: { userId, doctorId, date, time } },
    });
    return { onWaitlist: !!entry, entryId: entry?.id ?? null };
  }

  // Llamado desde AppointmentsService cuando se cancela una cita
  async notifyWaitlist(doctorId: string, date: string, time: string) {
    const entries = await this.prisma.waitlistEntry.findMany({
      where: { doctorId, date, time },
      include: { user: { select: { fcmToken: true, firstName: true } } },
      orderBy: { createdAt: 'asc' },
    });

    for (const entry of entries) {
      if (entry.user.fcmToken) {
        await this.notifications.sendToToken(
          entry.user.fcmToken,
          '🎉 ¡Se liberó un horario!',
          `Hay disponibilidad el ${date} a las ${time}. ¡Reserva rápido!`,
        ).catch(() => {});
      }
    }
  }
}
