import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { UploadService } from './upload.service';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Upload')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('avatar')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadAvatar(@Request() req, @UploadedFile() file: Express.Multer.File) {
    const url = await this.uploadService.uploadImage(file, 'bello-horizonte/avatars');

    await this.prisma.user.update({
      where: { id: req.user.id },
      data: { photoUrl: url },
    });

    // Si es doctor, también actualiza su foto en la tabla doctors
    if (req.user.role === 'DOCTOR') {
      await this.prisma.doctor.updateMany({
        where: { userId: req.user.id },
        data: { photoUrl: url },
      });
    }

    return { photoUrl: url };
  }
}
