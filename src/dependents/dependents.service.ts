import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

  async create(userId: string, dto: CreateDependentDto) {
    try {
      return await this.prisma.dependent.create({
        data: { userId, ...dto },
      });
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new ConflictException('Ya tienes un familiar con ese DNI');
      }
      throw e;
    }
  }

  async update(userId: string, id: string, dto: UpdateDependentDto) {
    await this.ensureOwner(userId, id);
    try {
      return await this.prisma.dependent.update({ where: { id }, data: { ...dto } });
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new ConflictException('Ya tienes un familiar con ese DNI');
      }
      throw e;
    }
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
