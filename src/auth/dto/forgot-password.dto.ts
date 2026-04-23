import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email o DNI del usuario para recuperar contraseña',
    example: 'usuario@ejemplo.com',
  })
  @IsString()
  @IsNotEmpty({ message: 'El identificador (email o DNI) es requerido' })
  identifier: string;
}
