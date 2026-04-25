import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CancelAppointmentDoctorDto,
  ConfirmAppointmentDto,
  PostponeAppointmentDto,
  UpdateDoctorProfileDto,
} from './dto/doctor-action.dto';

const MIN_CANCEL_HOURS = 2;

@Injectable()
export class DoctorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // ─── Obtener perfil del médico autenticado ───────────────────────────────────
  async getMyProfile(userId: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { userId },
      include: { specialty: true },
    });
    if (!doctor) throw new NotFoundException('Perfil de médico no encontrado');
    return doctor;
  }

  // ─── Actualizar perfil propio ────────────────────────────────────────────────
  async updateMyProfile(userId: string, dto: UpdateDoctorProfileDto) {
    const doctor = await this.prisma.doctor.findUnique({ where: { userId } });
    if (!doctor) throw new NotFoundException('Perfil de médico no encontrado');

    const updateData: any = {};
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.availableDays !== undefined) updateData.availableDays = dto.availableDays;
    if (dto.consultationFee !== undefined) updateData.consultationFee = dto.consultationFee;

    const updatedDoctor = await this.prisma.doctor.update({
      where: { id: doctor.id },
      data: updateData,
      include: { specialty: true },
    });

    if (dto.phone) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { phone: dto.phone },
      });
    }

    return updatedDoctor;
  }

  // ─── Agenda del médico ───────────────────────────────────────────────────────
  async getMyAgenda(userId: string, date?: string, status?: string) {
    const doctor = await this.prisma.doctor.findUnique({ where: { userId } });
    if (!doctor) throw new NotFoundException('Perfil de médico no encontrado');

    const where: any = { doctorId: doctor.id };
    if (date) where.appointmentDate = date;
    if (status) where.status = status;

    return this.prisma.appointment.findMany({
      where,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, phone: true, email: true, photoUrl: true },
        },
        specialty: true,
      },
      orderBy: [{ appointmentDate: 'asc' }, { appointmentTime: 'asc' }],
    });
  }

  // ─── Confirmar cita ──────────────────────────────────────────────────────────
  async confirmAppointment(userId: string, appointmentId: string, dto: ConfirmAppointmentDto) {
    const { appointment, doctor } = await this._getAppointmentForDoctor(userId, appointmentId);

    if (appointment.status !== 'PENDING') {
      throw new BadRequestException('Solo se pueden confirmar citas pendientes');
    }

    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'CONFIRMED', notes: dto.notes ?? appointment.notes },
    });

    await this._notifyPatient(
      appointment.userId,
      '✅ Cita confirmada',
      `Tu cita con Dr. ${doctor.firstName} ${doctor.lastName} el ${appointment.appointmentDate} a las ${appointment.appointmentTime} ha sido confirmada.`,
    );

    return updated;
  }

  // ─── Cancelar cita (doctor) ──────────────────────────────────────────────────
  async cancelAppointment(userId: string, appointmentId: string, dto: CancelAppointmentDoctorDto) {
    const { appointment, doctor } = await this._getAppointmentForDoctor(userId, appointmentId);

    if (['CANCELLED', 'COMPLETED'].includes(appointment.status)) {
      throw new BadRequestException('Esta cita ya no puede ser cancelada');
    }

    this._checkCancellationPolicy(appointment.appointmentDate, appointment.appointmentTime);

    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'CANCELLED', cancelReason: dto.reason },
    });

    await this._notifyPatient(
      appointment.userId,
      '❌ Cita cancelada por el médico',
      `Tu cita con Dr. ${doctor.firstName} ${doctor.lastName} el ${appointment.appointmentDate} fue cancelada. Motivo: ${dto.reason}`,
    );

    return updated;
  }

  // ─── Postergar cita ──────────────────────────────────────────────────────────
  async postponeAppointment(userId: string, appointmentId: string, dto: PostponeAppointmentDto) {
    const { appointment, doctor } = await this._getAppointmentForDoctor(userId, appointmentId);

    if (['CANCELLED', 'COMPLETED'].includes(appointment.status)) {
      throw new BadRequestException('Esta cita no puede ser postergada');
    }

    // Verificar que el nuevo slot no esté ocupado
    const conflict = await this.prisma.appointment.findUnique({
      where: {
        doctorId_appointmentDate_appointmentTime: {
          doctorId: doctor.id,
          appointmentDate: dto.newDate,
          appointmentTime: dto.newTime,
        },
      },
    });
    if (conflict) throw new BadRequestException('El nuevo horario ya está ocupado');

    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'POSTPONED',
        postponeReason: dto.reason,
        newDate: dto.newDate,
        newTime: dto.newTime,
      },
    });

    await this._notifyPatient(
      appointment.userId,
      '⏰ Cita postergada',
      `Tu cita con Dr. ${doctor.firstName} ${doctor.lastName} ha sido postergada al ${dto.newDate} a las ${dto.newTime}. Motivo: ${dto.reason}`,
    );

    return updated;
  }

  // ─── Marcar cita como completada ────────────────────────────────────────────
  async completeAppointment(userId: string, appointmentId: string) {
    const { appointment } = await this._getAppointmentForDoctor(userId, appointmentId);

    if (appointment.status !== 'CONFIRMED') {
      throw new BadRequestException('Solo se pueden completar citas confirmadas');
    }

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'COMPLETED' },
    });
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────
  private async _getAppointmentForDoctor(userId: string, appointmentId: string) {
    const doctor = await this.prisma.doctor.findUnique({ where: { userId } });
    if (!doctor) throw new NotFoundException('Perfil de médico no encontrado');

    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });
    if (!appointment) throw new NotFoundException('Cita no encontrada');
    if (appointment.doctorId !== doctor.id) throw new ForbiddenException('No tienes permiso sobre esta cita');

    return { appointment, doctor };
  }

  private _checkCancellationPolicy(date: string, time: string) {
    const appointmentDateTime = new Date(`${date}T${time}:00`);
    const now = new Date();
    const diffHours = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (diffHours < MIN_CANCEL_HOURS) {
      throw new BadRequestException(
        `No se puede cancelar con menos de ${MIN_CANCEL_HOURS} horas de anticipación`,
      );
    }
  }

  private async _notifyPatient(userId: string, title: string, body: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true },
    });
    if (user?.fcmToken) {
      await this.notifications.sendToToken(user.fcmToken, title, body).catch(() => {});
    }
  }
}
