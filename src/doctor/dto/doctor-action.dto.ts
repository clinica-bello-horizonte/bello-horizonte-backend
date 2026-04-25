import { IsDateString, IsNotEmpty, IsOptional, IsString, IsTimeZone, Matches } from 'class-validator';

export class ConfirmAppointmentDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CancelAppointmentDoctorDto {
  @IsString()
  @IsNotEmpty({ message: 'El motivo de cancelación es requerido' })
  reason: string;
}

export class PostponeAppointmentDto {
  @IsString()
  @IsNotEmpty({ message: 'El motivo de postergación es requerido' })
  reason: string;

  @IsString()
  @IsNotEmpty()
  newDate: string;

  @IsString()
  @IsNotEmpty()
  newTime: string;
}

export class UpdateDoctorProfileDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  availableDays?: number[];

  @IsOptional()
  consultationFee?: number;

  @IsOptional()
  @IsString()
  phone?: string;
}
