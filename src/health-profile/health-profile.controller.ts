import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthProfileService } from './health-profile.service';
import { UpdateHealthProfileDto } from './dto/update-health-profile.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Health Profile')
@Controller('health-profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class HealthProfileController {
  constructor(private readonly service: HealthProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener perfil de salud del usuario' })
  get(@CurrentUser('id') userId: string) {
    return this.service.get(userId);
  }

  @Put()
  @ApiOperation({ summary: 'Crear/actualizar perfil de salud del usuario' })
  upsert(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateHealthProfileDto,
  ) {
    return this.service.upsert(userId, dto);
  }
}
