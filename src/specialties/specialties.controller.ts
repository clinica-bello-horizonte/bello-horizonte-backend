import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SpecialtiesService } from './specialties.service';

@ApiTags('Specialties')
@Controller('specialties')
export class SpecialtiesController {
  constructor(private readonly specialtiesService: SpecialtiesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas las especialidades' })
  @ApiResponse({ status: 200, description: 'Lista de especialidades' })
  findAll() {
    return this.specialtiesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una especialidad por ID (incluye lista de médicos)' })
  @ApiResponse({ status: 200, description: 'Datos de la especialidad con sus médicos' })
  @ApiResponse({ status: 404, description: 'Especialidad no encontrada' })
  findOne(@Param('id') id: string) {
    return this.specialtiesService.findOne(id);
  }
}
