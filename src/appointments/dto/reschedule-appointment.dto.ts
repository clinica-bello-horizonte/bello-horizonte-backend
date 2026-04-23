import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString, Matches } from 'class-validator';

export class RescheduleAppointmentDto {
  @ApiProperty({
    description: 'Nueva fecha de la cita (YYYY-MM-DD)',
    example: '2024-06-20',
  })
  @IsNotEmpty({ message: 'La nueva fecha de la cita es requerida' })
  @IsDateString({}, { message: 'La fecha debe tener formato YYYY-MM-DD' })
  appointmentDate: string;

  @ApiProperty({
    description: 'Nueva hora de la cita (HH:mm)',
    example: '10:00',
  })
  @IsNotEmpty({ message: 'La nueva hora de la cita es requerida' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'La hora debe tener formato HH:mm (ej. 10:00)',
  })
  appointmentTime: string;
}
