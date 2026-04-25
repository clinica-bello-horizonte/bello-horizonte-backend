import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';

const APPOINTMENT_INCLUDE = {
  doctor: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      photoUrl: true,
      rating: true,
      consultationFee: true,
    },
  },
  specialty: {
    select: {
      id: true,
      name: true,
      icon: true,
      color: true,
    },
  },
};

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private async notifyUser(userId: string, title: string, body: string, data?: Record<string, string>) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true },
    });
    if (user?.fcmToken) {
      await this.notifications.sendToToken(user.fcmToken, title, body, data);
    }
  }

  // ─── Find All for User ────────────────────────────────────────────────────────
  async findAllByUser(userId: string) {
    const appointments = await this.prisma.appointment.findMany({
      where: { userId },
      include: APPOINTMENT_INCLUDE,
      orderBy: [{ appointmentDate: 'desc' }, { appointmentTime: 'desc' }],
    });

    return appointments;
  }

  // ─── Find Upcoming ────────────────────────────────────────────────────────────
  async findUpcoming(userId: string) {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const appointments = await this.prisma.appointment.findMany({
      where: {
        userId,
        status: {
          in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
        },
        appointmentDate: {
          gte: today,
        },
      },
      include: APPOINTMENT_INCLUDE,
      orderBy: [{ appointmentDate: 'asc' }, { appointmentTime: 'asc' }],
    });

    return appointments;
  }

  // ─── Find One (with ownership check) ─────────────────────────────────────────
  async findOne(userId: string, id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        ...APPOINTMENT_INCLUDE,
        patientRecord: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException(`Cita con ID ${id} no encontrada`);
    }

    if (appointment.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para ver esta cita');
    }

    return appointment;
  }

  // ─── Create ───────────────────────────────────────────────────────────────────
  async create(userId: string, dto: CreateAppointmentDto) {
    // Verify doctor exists
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: dto.doctorId },
    });

    if (!doctor) {
      throw new NotFoundException(`Médico con ID ${dto.doctorId} no encontrado`);
    }

    // Verify specialty exists
    const specialty = await this.prisma.specialty.findUnique({
      where: { id: dto.specialtyId },
    });

    if (!specialty) {
      throw new NotFoundException(`Especialidad con ID ${dto.specialtyId} no encontrada`);
    }

    // Check if slot is already booked
    const existingAppointment = await this.prisma.appointment.findFirst({
      where: {
        doctorId: dto.doctorId,
        appointmentDate: dto.appointmentDate,
        appointmentTime: dto.appointmentTime,
        status: {
          notIn: [AppointmentStatus.CANCELLED],
        },
      },
    });

    if (existingAppointment) {
      throw new ConflictException(
        `El horario ${dto.appointmentTime} del ${dto.appointmentDate} ya está reservado con este médico`,
      );
    }

    const appointment = await this.prisma.appointment.create({
      data: {
        userId,
        doctorId: dto.doctorId,
        specialtyId: dto.specialtyId,
        appointmentDate: dto.appointmentDate,
        appointmentTime: dto.appointmentTime,
        status: AppointmentStatus.PENDING,
        reason: dto.reason,
        notes: dto.notes || null,
      },
      include: APPOINTMENT_INCLUDE,
    });

    this.notifyUser(
      userId,
      '¡Cita reservada! 🗓️',
      `Tu cita con Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName} el ${dto.appointmentDate} a las ${dto.appointmentTime} ha sido registrada.`,
      { appointmentId: appointment.id, route: '/appointments' },
    );

    return appointment;
  }

  // ─── Cancel ───────────────────────────────────────────────────────────────────
  async cancel(userId: string, id: string, reason?: string) {
    if (!reason || reason.trim().length < 5) {
      throw new BadRequestException('El motivo de cancelación es obligatorio (mínimo 5 caracteres)');
    }

    const appointment = await this.prisma.appointment.findUnique({ where: { id } });

    if (!appointment) throw new NotFoundException(`Cita con ID ${id} no encontrada`);
    if (appointment.userId !== userId) throw new ForbiddenException('No tienes permiso para cancelar esta cita');

    const cancellableStatuses: AppointmentStatus[] = [
      AppointmentStatus.PENDING,
      AppointmentStatus.CONFIRMED,
    ];

    if (!cancellableStatuses.includes(appointment.status)) {
      throw new ConflictException(`No se puede cancelar una cita en estado ${appointment.status}`);
    }

    // Política: mínimo 2 horas de anticipación
    const appointmentDateTime = new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}:00`);
    const diffHours = (appointmentDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
    if (diffHours < 2) {
      throw new BadRequestException('No se puede cancelar con menos de 2 horas de anticipación');
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.CANCELLED, cancelReason: reason.trim() },
      include: APPOINTMENT_INCLUDE,
    });

    this.notifyUser(
      userId,
      'Cita cancelada',
      `Tu cita del ${updated.appointmentDate} a las ${updated.appointmentTime} ha sido cancelada.`,
      { appointmentId: id, route: '/appointments' },
    );

    return updated;
  }

  // ─── Reschedule ───────────────────────────────────────────────────────────────
  async reschedule(userId: string, id: string, dto: RescheduleAppointmentDto) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException(`Cita con ID ${id} no encontrada`);
    }

    if (appointment.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para reprogramar esta cita');
    }

    const reschedulableStatuses: AppointmentStatus[] = [
      AppointmentStatus.PENDING,
      AppointmentStatus.CONFIRMED,
      AppointmentStatus.RESCHEDULED,
    ];

    if (!reschedulableStatuses.includes(appointment.status)) {
      throw new ConflictException(
        `No se puede reprogramar una cita en estado ${appointment.status}`,
      );
    }

    // Check if new slot is available (excluding current appointment)
    const conflictingAppointment = await this.prisma.appointment.findFirst({
      where: {
        doctorId: appointment.doctorId,
        appointmentDate: dto.appointmentDate,
        appointmentTime: dto.appointmentTime,
        status: {
          notIn: [AppointmentStatus.CANCELLED],
        },
        id: { not: id }, // Exclude the current appointment
      },
    });

    if (conflictingAppointment) {
      throw new ConflictException(
        `El horario ${dto.appointmentTime} del ${dto.appointmentDate} ya está reservado con este médico`,
      );
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        appointmentDate: dto.appointmentDate,
        appointmentTime: dto.appointmentTime,
        status: AppointmentStatus.RESCHEDULED,
      },
      include: APPOINTMENT_INCLUDE,
    });

    this.notifyUser(
      userId,
      'Cita reprogramada 🔄',
      `Tu cita ha sido reprogramada para el ${dto.appointmentDate} a las ${dto.appointmentTime}.`,
      { appointmentId: id, route: '/appointments' },
    );

    return updated;
  }

  // ─── Get Booked Slots ─────────────────────────────────────────────────────────
  async getBookedSlots(doctorId: string, date: string): Promise<string[]> {
    // Verify doctor exists
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      throw new NotFoundException(`Médico con ID ${doctorId} no encontrado`);
    }

    const appointments = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        appointmentDate: date,
        status: {
          notIn: [AppointmentStatus.CANCELLED],
        },
      },
      select: {
        appointmentTime: true,
      },
    });

    return appointments.map((a) => a.appointmentTime);
  }
}
