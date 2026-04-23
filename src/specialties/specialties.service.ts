import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SpecialtiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const specialties = await this.prisma.specialty.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { doctors: true },
        },
      },
    });

    return specialties;
  }

  async findOne(id: string) {
    const specialty = await this.prisma.specialty.findUnique({
      where: { id },
      include: {
        doctors: {
          orderBy: [{ rating: 'desc' }, { lastName: 'asc' }],
          select: {
            id: true,
            firstName: true,
            lastName: true,
            description: true,
            photoUrl: true,
            rating: true,
            yearsExperience: true,
            consultationFee: true,
            availableDays: true,
            createdAt: true,
          },
        },
        _count: {
          select: { doctors: true },
        },
      },
    });

    if (!specialty) {
      throw new NotFoundException(`Especialidad con ID ${id} no encontrada`);
    }

    return specialty;
  }
}
