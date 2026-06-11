import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateHealthProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(8)
  bloodType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  allergies?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  chronicConditions?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  medications?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  emergencyContactPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  emergencyContactRelation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
