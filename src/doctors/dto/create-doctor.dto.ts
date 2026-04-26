import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDoctorDto {
  @ApiProperty({ description: 'Nombres del médico', example: 'Carlos' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  firstName: string;

  @ApiProperty({ description: 'Apellidos del médico', example: 'Mendoza Ríos' })
  @IsString()
  @IsNotEmpty({ message: 'Los apellidos son requeridos' })
  lastName: string;

  @ApiProperty({ description: 'DNI del médico', example: '45678901' })
  @IsString()
  @IsNotEmpty({ message: 'El DNI es requerido' })
  dni: string;

  @ApiProperty({ description: 'Correo electrónico', example: 'dr.carlos@bellohorizonte.pe' })
  @IsEmail({}, { message: 'Correo inválido' })
  @IsNotEmpty({ message: 'El correo es requerido' })
  email: string;

  @ApiProperty({ description: 'Teléfono', example: '987654321' })
  @IsString()
  @IsNotEmpty({ message: 'El teléfono es requerido' })
  phone: string;

  @ApiPropertyOptional({ description: 'Contraseña inicial (mín. 6 caracteres)', example: 'doctor123' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiProperty({
    description: 'ID de la especialidad',
    example: 'uuid-de-especialidad',
  })
  @IsUUID('4', { message: 'El specialtyId debe ser un UUID válido' })
  @IsNotEmpty({ message: 'La especialidad es requerida' })
  specialtyId: string;

  @ApiPropertyOptional({
    description: 'Descripción o biografía del médico',
    example: 'Cardiólogo con 15 años de experiencia...',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'URL de la foto del médico',
    example: 'https://example.com/photo.jpg',
  })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiPropertyOptional({
    description: 'Calificación del médico (0-5)',
    example: 4.8,
    minimum: 0,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  @Type(() => Number)
  rating?: number;

  @ApiPropertyOptional({
    description: 'Años de experiencia',
    example: 15,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  yearsExperience?: number;

  @ApiPropertyOptional({
    description: 'Tarifa de consulta en soles',
    example: 120.0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  consultationFee?: number;

  @ApiPropertyOptional({
    description: 'Días disponibles (0=Lun, 1=Mar, 2=Mié, 3=Jue, 4=Vie, 5=Sáb, 6=Dom)',
    example: [0, 1, 2, 3, 4],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  availableDays?: number[];
}
