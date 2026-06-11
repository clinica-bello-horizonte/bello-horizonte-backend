import { Module } from '@nestjs/common';
import { HealthProfileService } from './health-profile.service';
import { HealthProfileController } from './health-profile.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HealthProfileController],
  providers: [HealthProfileService],
})
export class HealthProfileModule {}
