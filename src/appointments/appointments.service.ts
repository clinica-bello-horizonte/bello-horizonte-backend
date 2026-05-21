import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SupabaseService } from '../supabase/supabase.service';
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
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly supabaseService: SupabaseService,
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

    // Check if slot is already booked (local DB)
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

    // Check if slot is already booked in Supabase (SYSTEMATIC/WhatsApp)
    // SYSTEMATIC guarda solo primer apellido: "Daniel Valera" no "Daniel Valera Arrunátegui"
    const doctorName = `${doctor.firstName} ${doctor.lastName.split(' ')[0]}`;
    const dateSpanish = this.supabaseService.formatDateSpanish(dto.appointmentDate);
    const supabaseSlots = await this.supabaseService.getBookedTimesFromSupabase(doctorName, dateSpanish);
    if (supabaseSlots.includes(dto.appointmentTime)) {
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

    // Escribir en Supabase (fire-and-forget, no bloquea la respuesta)
    this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, dni: true, phone: true },
    }).then((user) => {
      if (!user) return;
      this.supabaseService.writeAppointmentToSupabase({
        bellohorizonteId: appointment.id,
        doctorName: `${doctor.firstName} ${doctor.lastName.split(' ')[0]}`,
        patientName: `${user.firstName} ${user.lastName}`,
        patientDni: user.dni,
        contactPhone: user.phone,
        appointmentDate: dto.appointmentDate,
        appointmentTime: dto.appointmentTime,
        reason: specialty.name,
      });
    }).catch((e) => this.logger.error('Error sincronizando cita con Supabase', e));

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

    // Notificar al primero en la lista de espera para ese slot
    this.notifyWaitlistOnCancellation(
      updated.doctorId,
      updated.appointmentDate,
      updated.appointmentTime,
    );

    // Eliminar de Supabase (fire-and-forget)
    this.supabaseService.deleteAppointmentFromSupabase(id)
      .catch((e) => this.logger.error('Error eliminando cita de Supabase', e));

    return updated;
  }

  private async notifyWaitlistOnCancellation(doctorId: string, date: string, time: string) {
    try {
      const entries = await this.prisma.waitlistEntry.findMany({
        where: { doctorId, date, time },
        include: {
          user: { select: { id: true, fcmToken: true, firstName: true } },
          doctor: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'asc' },
        take: 1,
      });
      if (entries.length === 0) return;
      const entry = entries[0];
      if (entry.user.fcmToken) {
        await this.notifications.sendToToken(
          entry.user.fcmToken,
          '¡Slot disponible!',
          `${entry.user.firstName}, se liberó el horario ${time} del ${date} con Dr. ${entry.doctor.firstName} ${entry.doctor.lastName}. ¡Reserva ahora!`,
          { route: '/appointments/create', doctorId },
        );
      }
    } catch (_) {}
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
        status: { notIn: [AppointmentStatus.CANCELLED] },
      },
      select: { appointmentTime: true },
    });

    const localSlots = appointments.map((a) => a.appointmentTime);

    // Consultar también los slots ocupados en Supabase (citas por WhatsApp de SYSTEMATIC)
    const doctorName = `${doctor.firstName} ${doctor.lastName.split(' ')[0]}`;
    const dateSpanish = this.supabaseService.formatDateSpanish(date);
    const supabaseSlots = await this.supabaseService.getBookedTimesFromSupabase(doctorName, dateSpanish);

    return [...new Set([...localSlots, ...supabaseSlots])];
  }
}
