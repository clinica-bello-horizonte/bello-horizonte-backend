import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PatientRecordsService } from './patient-records.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Patient Records')
@Controller('patient-records')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class PatientRecordsController {
  constructor(private readonly patientRecordsService: PatientRecordsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los registros médicos del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Lista de registros médicos del paciente' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  findAll(@CurrentUser('id') userId: string) {
    return this.patientRecordsService.findAllByUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un registro médico por ID (solo del usuario autenticado)' })
  @ApiResponse({ status: 200, description: 'Datos del registro médico' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No tiene permiso para ver este registro' })
  @ApiResponse({ status: 404, description: 'Registro médico no encontrado' })
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.patientRecordsService.findOne(userId, id);
  }
}
