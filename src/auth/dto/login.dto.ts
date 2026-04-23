import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Email o DNI del usuario',
    example: 'demo@bellohorizonte.pe',
  })
  @IsString()
  @IsNotEmpty({ message: 'El identificador (email o DNI) es requerido' })
  identifier: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'demo123',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;
}
