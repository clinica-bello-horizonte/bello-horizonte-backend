import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'Nombres del usuario',
    example: 'Juan Carlos',
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Apellidos del usuario',
    example: 'García López',
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Número de teléfono',
    example: '987654321',
  })
  @IsOptional()
  @IsString()
  @MinLength(9, { message: 'El teléfono debe tener al menos 9 dígitos' })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Fecha de nacimiento (YYYY-MM-DD)',
    example: '1990-05-15',
  })
  @IsOptional()
  @IsString()
  birthDate?: string;
}
