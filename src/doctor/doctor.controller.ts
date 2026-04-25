import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, Role } from '../common/decorators/roles.decorator';
import { DoctorService } from './doctor.service';
import {
  CancelAppointmentDoctorDto,
  ConfirmAppointmentDto,
  PostponeAppointmentDto,
  UpdateDoctorProfileDto,
} from './dto/doctor-action.dto';

@ApiTags('Doctor')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DOCTOR)
@Controller('doctor')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Get('profile')
  getMyProfile(@Request() req) {
    return this.doctorService.getMyProfile(req.user.sub);
  }

  @Patch('profile')
  updateMyProfile(@Request() req, @Body() dto: UpdateDoctorProfileDto) {
    return this.doctorService.updateMyProfile(req.user.sub, dto);
  }

  @Get('agenda')
  getMyAgenda(
    @Request() req,
    @Query('date') date?: string,
    @Query('status') status?: string,
  ) {
    return this.doctorService.getMyAgenda(req.user.sub, date, status);
  }

  @Patch('appointments/:id/confirm')
  confirmAppointment(@Request() req, @Param('id') id: string, @Body() dto: ConfirmAppointmentDto) {
    return this.doctorService.confirmAppointment(req.user.sub, id, dto);
  }

  @Patch('appointments/:id/cancel')
  cancelAppointment(@Request() req, @Param('id') id: string, @Body() dto: CancelAppointmentDoctorDto) {
    return this.doctorService.cancelAppointment(req.user.sub, id, dto);
  }

  @Patch('appointments/:id/postpone')
  postponeAppointment(@Request() req, @Param('id') id: string, @Body() dto: PostponeAppointmentDto) {
    return this.doctorService.postponeAppointment(req.user.sub, id, dto);
  }

  @Patch('appointments/:id/complete')
  completeAppointment(@Request() req, @Param('id') id: string) {
    return this.doctorService.completeAppointment(req.user.sub, id);
  }
}
