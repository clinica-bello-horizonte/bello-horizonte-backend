import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Admin - Stats')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/stats')
export class AdminStatsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getStats() {
    const [appointments, byStatus, doctors, specialties] = await Promise.all([
      this.prisma.appointment.count(),
      this.prisma.appointment.groupBy({ by: ['status'], _count: { id: true } }),
      this.prisma.appointment.groupBy({
        by: ['doctorId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
      this.prisma.appointment.groupBy({
        by: ['specialtyId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
    ]);

    // Citas por mes (últimos 6 meses)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const recentAppointments = await this.prisma.appointment.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    });
    const byMonth: Record<string, number> = {};
    recentAppointments.forEach(a => {
      const key = `${a.createdAt.getFullYear()}-${String(a.createdAt.getMonth() + 1).padStart(2, '0')}`;
      byMonth[key] = (byMonth[key] ?? 0) + 1;
    });

    // Top doctors con nombres
    const topDoctorIds = doctors.map(d => d.doctorId);
    const doctorNames = await this.prisma.doctor.findMany({
      where: { id: { in: topDoctorIds } },
      select: { id: true, firstName: true, lastName: true },
    });
    const topDoctors = doctors.map(d => {
      const doc = doctorNames.find(n => n.id === d.doctorId);
      return { name: doc ? `${doc.firstName} ${doc.lastName}` : 'Desconocido', count: d._count.id };
    });

    // Top especialidades con nombres
    const topSpecialtyIds = specialties.map(s => s.specialtyId);
    const specialtyNames = await this.prisma.specialty.findMany({
      where: { id: { in: topSpecialtyIds } },
      select: { id: true, name: true },
    });
    const topSpecialties = specialties.map(s => {
      const spec = specialtyNames.find(n => n.id === s.specialtyId);
      return { name: spec?.name ?? 'Desconocida', count: s._count.id };
    });

    return {
      totalAppointments: appointments,
      byStatus: Object.fromEntries(byStatus.map(s => [s.status, s._count.id])),
      byMonth: Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => ({ month, count })),
      topDoctors,
      topSpecialties,
    };
  }
}
