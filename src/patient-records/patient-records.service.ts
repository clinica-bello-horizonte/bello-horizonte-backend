import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PatientRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUser(userId: string) {
    const records = await this.prisma.patientRecord.findMany({
      where: { userId },
      include: {
        appointment: {
          select: {
            id: true,
            appointmentDate: true,
            appointmentTime: true,
            status: true,
            reason: true,
            doctor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                photoUrl: true,
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
          },
        },
      },
      orderBy: { recordDate: 'desc' },
    });

    return records;
  }

  async findOne(userId: string, id: string) {
    const record = await this.prisma.patientRecord.findUnique({
      where: { id },
      include: {
        appointment: {
          select: {
            id: true,
            appointmentDate: true,
            appointmentTime: true,
            status: true,
            reason: true,
            notes: true,
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
                description: true,
                icon: true,
                color: true,
              },
            },
          },
        },
      },
    });

    if (!record) {
      throw new NotFoundException(`Registro médico con ID ${id} no encontrado`);
    }

    if (record.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para ver este registro médico');
    }

    return record;
  }
}
