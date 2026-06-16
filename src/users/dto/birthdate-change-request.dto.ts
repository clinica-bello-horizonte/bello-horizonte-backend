import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, Matches } from 'class-validator';

export class BirthDateChangeRequestDto {
  @ApiProperty({
    description: 'Nueva fecha de nacimiento solicitada (YYYY-MM-DD)',
    example: '1990-05-15',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha debe tener formato YYYY-MM-DD',
  })
  requestedBirthDate: string;

  @ApiPropertyOptional({ description: 'Motivo del cambio' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
