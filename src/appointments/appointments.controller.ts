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
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Appointments')
@Controller('appointments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas las citas del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Lista de citas del usuario' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  findAll(@CurrentUser('id') userId: string) {
    return this.appointmentsService.findAllByUser(userId);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Listar próximas citas del usuario (PENDING y CONFIRMED)' })
  @ApiResponse({ status: 200, description: 'Lista de próximas citas' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  findUpcoming(@CurrentUser('id') userId: string) {
    return this.appointmentsService.findUpcoming(userId);
  }

  @Get('booked-slots')
  @ApiOperation({ summary: 'Obtener horarios ocupados de un médico en una fecha' })
  @ApiQuery({ name: 'doctorId', required: true, description: 'ID del médico' })
  @ApiQuery({ name: 'date', required: true, description: 'Fecha a consultar (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Lista de horarios ocupados (HH:mm)' })
  @ApiResponse({ status: 404, description: 'Médico no encontrado' })
  getBookedSlots(
    @Query('doctorId') doctorId: string,
    @Query('date') date: string,
  ) {
    return this.appointmentsService.getBookedSlots(doctorId, date);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una cita por ID (solo del usuario autenticado)' })
  @ApiResponse({ status: 200, description: 'Datos de la cita' })
  @ApiResponse({ status: 403, description: 'No tiene permiso para ver esta cita' })
  @ApiResponse({ status: 404, description: 'Cita no encontrada' })
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.appointmentsService.findOne(userId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear nueva cita médica' })
  @ApiResponse({ status: 201, description: 'Cita creada exitosamente' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 409, description: 'El horario ya está reservado' })
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateAppointmentDto,
  ) {
    return this.appointmentsService.create(userId, dto);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancelar una cita (solo PENDING o CONFIRMED)' })
  @ApiResponse({ status: 200, description: 'Cita cancelada exitosamente' })
  @ApiResponse({ status: 403, description: 'No tiene permiso para cancelar esta cita' })
  @ApiResponse({ status: 404, description: 'Cita no encontrada' })
  @ApiResponse({ status: 409, description: 'No se puede cancelar la cita en su estado actual' })
  cancel(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.appointmentsService.cancel(userId, id);
  }

  @Patch(':id/reschedule')
  @ApiOperation({ summary: 'Reprogramar una cita a nueva fecha y hora' })
  @ApiResponse({ status: 200, description: 'Cita reprogramada exitosamente' })
  @ApiResponse({ status: 403, description: 'No tiene permiso para reprogramar esta cita' })
  @ApiResponse({ status: 404, description: 'Cita no encontrada' })
  @ApiResponse({ status: 409, description: 'El nuevo horario ya está reservado' })
  reschedule(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: RescheduleAppointmentDto,
  ) {
    return this.appointmentsService.reschedule(userId, id, dto);
  }
}
