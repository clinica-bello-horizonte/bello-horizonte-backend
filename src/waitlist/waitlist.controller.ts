import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { WaitlistService } from './waitlist.service';

@ApiTags('Waitlist')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('waitlist')
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Post()
  join(@CurrentUser('id') userId: string, @Body() body: { doctorId: string; date: string; time: string }) {
    return this.waitlistService.join(userId, body.doctorId, body.date, body.time);
  }

  @Get('my')
  getMy(@CurrentUser('id') userId: string) {
    return this.waitlistService.getMy(userId);
  }

  @Delete(':id')
  leave(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.waitlistService.leave(userId, id);
  }

  @Get('check')
  check(
    @CurrentUser('id') userId: string,
    @Body() body: { doctorId: string; date: string; time: string },
  ) {
    return this.waitlistService.isOnWaitlist(userId, body.doctorId, body.date, body.time);
  }
}
