import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateQuizDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  assignmentId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  timeLimit?: number;
}
