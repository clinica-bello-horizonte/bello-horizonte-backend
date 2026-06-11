import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateHealthProfileDto } from './dto/update-health-profile.dto';

@Injectable()
export class HealthProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string) {
    const profile = await this.prisma.healthProfile.findUnique({
      where: { userId },
    });
    // Siempre devolver un objeto (vacío si aún no existe)
    return profile ?? { userId, bloodType: null };
  }

  async upsert(userId: string, dto: UpdateHealthProfileDto) {
    return this.prisma.healthProfile.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: { ...dto },
    });
  }
}
