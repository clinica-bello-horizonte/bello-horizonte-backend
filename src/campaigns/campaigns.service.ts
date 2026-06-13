import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCampaignDto, UpdateCampaignDto } from './dto/campaign.dto';

@Injectable()
export class CampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Campañas activas para mostrar en el inicio (orden ascendente). */
  findActive() {
    return this.prisma.campaign.findMany({
      where: { active: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
  }

  /** Todas las campañas (gestión admin). */
  findAll() {
    return this.prisma.campaign.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
  }

  create(dto: CreateCampaignDto) {
    return this.prisma.campaign.create({ data: dto });
  }

  async update(id: string, dto: UpdateCampaignDto) {
    await this.ensureExists(id);
    return this.prisma.campaign.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.campaign.delete({ where: { id } });
    return { success: true };
  }

  private async ensureExists(id: string) {
    const c = await this.prisma.campaign.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Campaña no encontrada');
  }
}
