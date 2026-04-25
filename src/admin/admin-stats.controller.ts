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
    const all = await this.prisma.appointment.findMany({
      select: {
        status: true,
        doctorId: true,
        specialtyId: true,
        createdAt: true,
        doctor: { select: { firstName: true, lastName: true } },
        specialty: { select: { name: true } },
      },
    });

    const total = all.length;

    // Por estado
    const byStatus: Record<string, number> = {};
    for (const a of all) {
      byStatus[a.status] = (byStatus[a.status] ?? 0) + 1;
    }

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

    return { totalAppointments: total, byStatus, byMonth, topDoctors, topSpecialties };
  }
}
