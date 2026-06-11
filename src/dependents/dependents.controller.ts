import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DependentsService } from './dependents.service';
import { CreateDependentDto, UpdateDependentDto } from './dto/dependent.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Dependents')
@Controller('dependents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class DependentsController {
  constructor(private readonly service: DependentsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar familiares del usuario' })
  findAll(@CurrentUser('id') userId: string) {
    return this.service.findAll(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Agregar un familiar' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateDependentDto) {
    return this.service.create(userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un familiar' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateDependentDto,
  ) {
    return this.service.update(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un familiar' })
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.service.remove(userId, id);
  }
}
