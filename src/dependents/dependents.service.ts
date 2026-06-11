import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDependentDto, UpdateDependentDto } from './dto/dependent.dto';

@Injectable()
export class DependentsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.dependent.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  create(userId: string, dto: CreateDependentDto) {
    return this.prisma.dependent.create({
      data: { userId, ...dto },
    });
  }

  async update(userId: string, id: string, dto: UpdateDependentDto) {
    await this.ensureOwner(userId, id);
    return this.prisma.dependent.update({ where: { id }, data: { ...dto } });
  }

  async remove(userId: string, id: string) {
    await this.ensureOwner(userId, id);
    await this.prisma.dependent.delete({ where: { id } });
    return { success: true };
  }

  private async ensureOwner(userId: string, id: string) {
    const dep = await this.prisma.dependent.findUnique({ where: { id } });
    if (!dep) throw new NotFoundException('Familiar no encontrado');
    if (dep.userId !== userId) {
      throw new ForbiddenException('No tienes permiso sobre este familiar');
    }
  }
}
