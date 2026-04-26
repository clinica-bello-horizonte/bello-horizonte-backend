import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';

@Injectable()
export class DoctorsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string, specialtyId?: string) {
    const where: any = {};

    if (specialtyId) {
      where.specialtyId = specialtyId;
    }

    if (search) {
      where.OR = [
        {
          firstName: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          lastName: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const doctors = await this.prisma.doctor.findMany({
      where,
      include: {
        specialty: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          },
        },
      },
      orderBy: [{ rating: 'desc' }, { lastName: 'asc' }],
    });

    return doctors;
  }

  async findOne(id: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
      include: {
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
    });

    if (!doctor) {
      throw new NotFoundException(`Médico con ID ${id} no encontrado`);
    }

    return doctor;
  }

  async create(dto: CreateDoctorDto) {
    const specialty = await this.prisma.specialty.findUnique({ where: { id: dto.specialtyId } });
    if (!specialty) throw new NotFoundException(`Especialidad con ID ${dto.specialtyId} no encontrada`);

    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email.toLowerCase() }, { dni: dto.dni }] },
    });
    if (existing) throw new ConflictException('Ya existe un usuario con ese DNI o correo');

    const tempPassword = dto.password ?? dto.dni; // usa DNI como contraseña por defecto
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          dni: dto.dni,
          email: dto.email.toLowerCase(),
          phone: dto.phone,
          firstName: dto.firstName,
          lastName: dto.lastName,
          passwordHash,
          role: Role.DOCTOR,
        },
      });

      const doctor = await tx.doctor.create({
        data: {
          userId: user.id,
          firstName: dto.firstName,
          lastName: dto.lastName,
          specialtyId: dto.specialtyId,
          description: dto.description || null,
          photoUrl: dto.photoUrl || null,
          rating: dto.rating ?? 0,
          yearsExperience: dto.yearsExperience ?? 0,
          consultationFee: dto.consultationFee ?? 0,
          availableDays: dto.availableDays ?? [],
        },
        include: { specialty: { select: { id: true, name: true, icon: true, color: true } } },
      });

      return { doctor, credentials: { email: user.email, password: tempPassword } };
    });

    return result;
  }

  async delete(id: string) {
    const doctor = await this.prisma.doctor.findUnique({ where: { id } });
    if (!doctor) throw new NotFoundException('Médico no encontrado');

    await this.prisma.$transaction(async (tx) => {
      await tx.doctor.delete({ where: { id } });
      if (doctor.userId) {
        await tx.user.delete({ where: { id: doctor.userId } });
      }
    });

    return { success: true };
  }

  async update(id: string, dto: UpdateDoctorDto) {
    const existing = await this.prisma.doctor.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Médico con ID ${id} no encontrado`);
    }

    if (dto.specialtyId) {
      const specialty = await this.prisma.specialty.findUnique({
        where: { id: dto.specialtyId },
      });
      if (!specialty) {
        throw new NotFoundException(`Especialidad con ID ${dto.specialtyId} no encontrada`);
      }
    }

    const doctor = await this.prisma.doctor.update({
      where: { id },
      data: {
        ...(dto.firstName && { firstName: dto.firstName }),
        ...(dto.lastName && { lastName: dto.lastName }),
        ...(dto.specialtyId && { specialtyId: dto.specialtyId }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.photoUrl !== undefined && { photoUrl: dto.photoUrl }),
        ...(dto.rating !== undefined && { rating: dto.rating }),
        ...(dto.yearsExperience !== undefined && { yearsExperience: dto.yearsExperience }),
        ...(dto.consultationFee !== undefined && { consultationFee: dto.consultationFee }),
        ...(dto.availableDays !== undefined && { availableDays: dto.availableDays }),
      },
      include: {
        specialty: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          },
        },
      },
    });

    return doctor;
  }
}
