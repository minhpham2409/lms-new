import { IsBoolean, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

export class UpdateVideoProgressDto {
  @IsString()
  lessonId: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  watchTime?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  watchedPercentage?: number;

  @IsBoolean()
  @IsOptional()
  completed?: boolean;
}
