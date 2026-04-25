import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateRatingDto, RatingsService } from './ratings.service';

@ApiTags('Ratings')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post('appointments/:id')
  rateAppointment(
    @Request() req,
    @Param('id') appointmentId: string,
    @Body() dto: CreateRatingDto,
  ) {
    return this.ratingsService.rateAppointment(req.user.id, appointmentId, dto);
  }

  @Get('appointments/:id')
  getAppointmentRating(@Param('id') appointmentId: string) {
    return this.ratingsService.getAppointmentRating(appointmentId);
  }
}
