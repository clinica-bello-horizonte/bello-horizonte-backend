import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Doctors')
@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar médicos (con filtros opcionales)' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nombre' })
  @ApiQuery({ name: 'specialtyId', required: false, description: 'Filtrar por especialidad' })
  @ApiResponse({ status: 200, description: 'Lista de médicos' })
  findAll(
    @Query('search') search?: string,
    @Query('specialtyId') specialtyId?: string,
  ) {
    return this.doctorsService.findAll(search, specialtyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un médico por ID' })
  @ApiResponse({ status: 200, description: 'Datos del médico' })
  @ApiResponse({ status: 404, description: 'Médico no encontrado' })
  findOne(@Param('id') id: string) {
    return this.doctorsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[ADMIN] Crear nuevo médico' })
  @ApiResponse({ status: 201, description: 'Médico creado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No tiene permisos de administrador' })
  create(@Body() dto: CreateDoctorDto) {
    return this.doctorsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[ADMIN] Actualizar datos de un médico' })
  @ApiResponse({ status: 200, description: 'Médico actualizado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No tiene permisos de administrador' })
  @ApiResponse({ status: 404, description: 'Médico no encontrado' })
  update(@Param('id') id: string, @Body() dto: UpdateDoctorDto) {
    return this.doctorsService.update(id, dto);
  }
}
