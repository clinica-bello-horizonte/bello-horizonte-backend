import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MinLength,
} from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty({
    description: 'ID del médico',
    example: 'uuid-del-medico',
  })
  @IsUUID('4', { message: 'El doctorId debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El médico es requerido' })
  doctorId: string;

  @ApiProperty({
    description: 'ID de la especialidad',
    example: 'uuid-de-especialidad',
  })
  @IsUUID('4', { message: 'El specialtyId debe ser un UUID válido' })
  @IsNotEmpty({ message: 'La especialidad es requerida' })
  specialtyId: string;

  @ApiProperty({
    description: 'Fecha de la cita (YYYY-MM-DD)',
    example: '2024-05-15',
  })
  @IsNotEmpty({ message: 'La fecha de la cita es requerida' })
  @IsDateString({}, { message: 'La fecha debe tener formato YYYY-MM-DD' })
  appointmentDate: string;

  @ApiProperty({
    description: 'Hora de la cita (HH:mm)',
    example: '09:30',
  })
  @IsNotEmpty({ message: 'La hora de la cita es requerida' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'La hora debe tener formato HH:mm (ej. 09:30)',
  })
  appointmentTime: string;

  @ApiProperty({
    description: 'Motivo de la consulta (mínimo 10 caracteres)',
    example: 'Dolor de pecho frecuente al realizar esfuerzo físico',
    minLength: 10,
  })
  @IsNotEmpty({ message: 'El motivo de la consulta es requerido' })
  @IsString()
  @MinLength(10, { message: 'El motivo debe tener al menos 10 caracteres' })
  reason: string;

  @ApiPropertyOptional({
    description: 'Notas adicionales para la consulta',
    example: 'El paciente toma medicamentos para la presión',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
