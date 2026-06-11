import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSpecialtyDto } from './dto/create-specialty.dto';

@Injectable()
export class SpecialtiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSpecialtyDto) {
    const existing = await this.prisma.specialty.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException('Ya existe una especialidad con ese nombre');
    }
    return this.prisma.specialty.create({ data: dto });
  }

  async remove(id: string) {
    const specialty = await this.prisma.specialty.findUnique({
      where: { id },
      include: { _count: { select: { doctors: true, appointments: true } } },
    });
    if (!specialty) {
      throw new NotFoundException('Especialidad no encontrada');
    }
    if (specialty._count.doctors > 0 || specialty._count.appointments > 0) {
      throw new BadRequestException(
        'No se puede eliminar: la especialidad tiene médicos o citas asociadas',
      );
    }
    await this.prisma.specialty.delete({ where: { id } });
    return { success: true };
  }

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
