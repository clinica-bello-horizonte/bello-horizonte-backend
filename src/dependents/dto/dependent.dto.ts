import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class CreateDependentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  lastName: string;

  @IsOptional()
  @IsString()
  @Length(8, 8)
  dni?: string;

  @IsOptional()
  @IsString()
  birthDate?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  relation: string;
}

export class UpdateDependentDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  lastName?: string;

  @IsOptional()
  @IsString()
  @Length(8, 8)
  dni?: string;

  @IsOptional()
  @IsString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  relation?: string;
}
