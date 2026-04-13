import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, IsNumber, IsDateString, IsIn } from 'class-validator';

export class CreateAssignmentDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ['essay', 'quiz'] })
  @IsIn(['essay', 'quiz'])
  type: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  lessonId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minScore?: number;
}
