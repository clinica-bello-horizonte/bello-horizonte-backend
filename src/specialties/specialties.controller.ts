import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { SpecialtiesService } from './specialties.service';
import { CreateSpecialtyDto } from './dto/create-specialty.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

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

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[ADMIN] Crear especialidad' })
  @ApiResponse({ status: 201, description: 'Especialidad creada' })
  @ApiResponse({ status: 403, description: 'No tiene permisos de administrador' })
  @ApiResponse({ status: 409, description: 'Ya existe una especialidad con ese nombre' })
  create(@Body() dto: CreateSpecialtyDto) {
    return this.specialtiesService.create(dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[ADMIN] Eliminar especialidad' })
  @ApiResponse({ status: 200, description: 'Especialidad eliminada' })
  @ApiResponse({ status: 400, description: 'Tiene médicos o citas asociadas' })
  @ApiResponse({ status: 403, description: 'No tiene permisos de administrador' })
  remove(@Param('id') id: string) {
    return this.specialtiesService.remove(id);
  }
}
