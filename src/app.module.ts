import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DoctorsModule } from './doctors/doctors.module';
import { SpecialtiesModule } from './specialties/specialties.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { PatientRecordsModule } from './patient-records/patient-records.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DoctorModule } from './doctor/doctor.module';
import { UploadModule } from './upload/upload.module';
import { RatingsModule } from './ratings/ratings.module';
import { AdminAppointmentsController } from './appointments/admin-appointments.controller';
import { AdminStatsController } from './admin/admin-stats.controller';
import { WaitlistModule } from './waitlist/waitlist.module';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    PrismaModule,
    AuthModule,
    UsersModule,
    DoctorsModule,
    SpecialtiesModule,
    AppointmentsModule,
    PatientRecordsModule,
    NotificationsModule,
    DoctorModule,
    UploadModule,
    RatingsModule,
    WaitlistModule,
  ],
  controllers: [AdminAppointmentsController, AdminStatsController],
  providers: [PrismaService],
})
export class AppModule {}
