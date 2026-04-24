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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    DoctorsModule,
    SpecialtiesModule,
    AppointmentsModule,
    PatientRecordsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
