import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Admin - Appointments')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/appointments')
export class AdminAppointmentsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('by-doctor/:doctorId')
  async getByDoctor(
    @Param('doctorId') doctorId: string,
    @Query('date') date?: string,
    @Query('status') status?: string,
  ) {
    const where: any = { doctorId };
    if (date) where.appointmentDate = date;
    if (status) where.status = status;

    return this.prisma.appointment.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        specialty: true,
        doctor: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [{ appointmentDate: 'asc' }, { appointmentTime: 'asc' }],
    });
  }

  @Patch(':id/status/:status')
  async changeStatus(@Param('id') id: string, @Param('status') status: string) {
    return this.prisma.appointment.update({
      where: { id },
      data: { status: status as any },
    });
  }
}
