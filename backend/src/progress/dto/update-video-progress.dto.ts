import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateVideoProgressDto {
  @IsString()
  lessonId: string;

  @IsNumber()
  @IsOptional()
  watchTime?: number;

  @IsBoolean()
  @IsOptional()
  completed?: boolean;
}
