import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';

export class SendNotificationDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsString()
  @MinLength(1)
  body: string;

  @IsArray()
  @IsOptional()
  userIds?: string[];
}
