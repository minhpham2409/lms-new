import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, IsNumber, IsArray, Min } from 'class-validator';

export class CreateQuestionDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  quizId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({ description: 'JSON array of options [{id, text}]' })
  @IsArray()
  options: { id: string; text: string }[];

  @ApiProperty({ description: 'Correct option id' })
  @IsNotEmpty()
  @IsString()
  answer: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  score?: number;
}
