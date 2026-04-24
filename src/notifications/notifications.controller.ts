import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { NotificationsService } from './notifications.service';
import { SendNotificationDto } from './dto/send-notification.dto';

@ApiTags('Admin - Notifications')
@Controller('admin/notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth('access-token')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get('users')
  @ApiOperation({ summary: 'Listar usuarios para envío de notificaciones' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios' })
  listUsers() {
    return this.notifications.listUsers();
  }

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enviar notificación a usuarios específicos o broadcast' })
  @ApiResponse({ status: 200, description: 'Notificación enviada' })
  async send(@Body() dto: SendNotificationDto) {
    if (!dto.userIds || dto.userIds.length === 0) {
      return this.notifications.broadcast(dto.title, dto.body);
    }
    return this.notifications.sendToUsers(dto.userIds, dto.title, dto.body);
  }
}
