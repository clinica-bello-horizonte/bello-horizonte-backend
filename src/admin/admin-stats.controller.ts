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
    // Traer todos los campos necesarios en una sola consulta
    const [all, ratingAgg] = await Promise.all([
      this.prisma.appointment.findMany({
        select: {
          status: true,
          doctorId: true,
          specialtyId: true,
          createdAt: true,
          appointmentDate: true,
          doctor: {
            select: { firstName: true, lastName: true, consultationFee: true },
          },
          specialty: { select: { name: true } },
        },
      }),
      this.prisma.doctorRating.aggregate({
        _avg: { stars: true },
        _count: { stars: true },
      }),
    ]);

    const total = all.length;

    // Por estado
    const byStatus: Record<string, number> = {};
    for (const a of all) {
      byStatus[a.status] = (byStatus[a.status] ?? 0) + 1;
    }

    // ── KPIs ejecutivos ──────────────────────────────────────────────────────
    const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const in7 = new Date();
    in7.setDate(in7.getDate() + 7);
    const in7Str = in7.toISOString().slice(0, 10);

    let estimatedRevenue = 0;
    let completed = 0;
    let cancelled = 0;
    let noShow = 0;
    let upcoming7Days = 0;
    for (const a of all) {
      if (a.status === 'COMPLETED') {
        completed++;
        estimatedRevenue += a.doctor?.consultationFee ?? 0;
      } else if (a.status === 'CANCELLED') {
        cancelled++;
      }
      // Inasistencia: cita pasada que no se completó ni se canceló.
      if (
        a.appointmentDate < todayStr &&
        a.status !== 'COMPLETED' &&
        a.status !== 'CANCELLED'
      ) {
        noShow++;
      }
      // Carga próxima (7 días): citas activas agendadas.
      if (
        a.appointmentDate >= todayStr &&
        a.appointmentDate <= in7Str &&
        (a.status === 'PENDING' || a.status === 'CONFIRMED')
      ) {
        upcoming7Days++;
      }
    }
    const noShowRate = total > 0 ? noShow / total : 0;
    const cancelledRate = total > 0 ? cancelled / total : 0;
    const attendanceRate = total > 0 ? completed / total : 0;
    const avgRating = ratingAgg._avg.stars ?? 0;
    const ratingCount = ratingAgg._count.stars ?? 0;

    // Por mes (últimos 6 meses)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const byMonthMap: Record<string, number> = {};
    for (const a of all) {
      if (a.createdAt >= sixMonthsAgo) {
        const key = `${a.createdAt.getFullYear()}-${String(a.createdAt.getMonth() + 1).padStart(2, '0')}`;
        byMonthMap[key] = (byMonthMap[key] ?? 0) + 1;
      }
    }
    const byMonth = Object.entries(byMonthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));

    // Top médicos
    const doctorCount: Record<string, { name: string; count: number }> = {};
    for (const a of all) {
      if (!doctorCount[a.doctorId]) {
        const name = a.doctor ? `${a.doctor.firstName} ${a.doctor.lastName}` : 'Desconocido';
        doctorCount[a.doctorId] = { name, count: 0 };
      }
      doctorCount[a.doctorId].count++;
    }
    const topDoctors = Object.values(doctorCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(({ name, count }) => ({ name, count }));

    // Top especialidades
    const specCount: Record<string, { name: string; count: number }> = {};
    for (const a of all) {
      if (!specCount[a.specialtyId]) {
        specCount[a.specialtyId] = { name: a.specialty?.name ?? 'Desconocida', count: 0 };
      }
      specCount[a.specialtyId].count++;
    }
    const topSpecialties = Object.values(specCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(({ name, count }) => ({ name, count }));

    return {
      totalAppointments: total,
      byStatus,
      byMonth,
      topDoctors,
      topSpecialties,
      // KPIs ejecutivos
      estimatedRevenue,
      completed,
      cancelled,
      noShow,
      noShowRate,
      cancelledRate,
      attendanceRate,
      upcoming7Days,
      avgRating,
      ratingCount,
    };
  }
}
