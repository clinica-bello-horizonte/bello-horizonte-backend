import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateRatingDto {
  @IsInt()
  @Min(1)
  @Max(5)
  stars: number;

  @IsOptional()
  @IsString()
  comment?: string;
}

@Injectable()
export class RatingsService {
  constructor(private readonly prisma: PrismaService) {}

  async rateAppointment(userId: string, appointmentId: string, dto: CreateRatingDto) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { doctor: true },
    });

    if (!appointment) throw new NotFoundException('Cita no encontrada');
    if (appointment.userId !== userId) throw new BadRequestException('No puedes calificar esta cita');
    if (appointment.status !== 'COMPLETED') throw new BadRequestException('Solo puedes calificar citas completadas');

    const existing = await this.prisma.doctorRating.findUnique({
      where: { appointmentId },
    });
    if (existing) throw new BadRequestException('Ya calificaste esta cita');

    const rating = await this.prisma.doctorRating.create({
      data: {
        appointmentId,
        doctorId: appointment.doctorId,
        userId,
        stars: dto.stars,
        comment: dto.comment,
      },
    });

    // Recalcular rating promedio del doctor
    const allRatings = await this.prisma.doctorRating.findMany({
      where: { doctorId: appointment.doctorId },
      select: { stars: true },
    });
    const avg = allRatings.reduce((sum, r) => sum + r.stars, 0) / allRatings.length;

    await this.prisma.doctor.update({
      where: { id: appointment.doctorId },
      data: { rating: Math.round(avg * 10) / 10, ratingCount: allRatings.length },
    });

    return rating;
  }

  async getAppointmentRating(appointmentId: string) {
    return this.prisma.doctorRating.findUnique({ where: { appointmentId } });
  }
}
