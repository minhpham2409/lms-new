import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class BulkQuestionItemDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  content: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ description: 'Array of strings' })
  @IsArray()
  @IsString({ each: true })
  options: string[];

  @ApiProperty({ description: 'Exact text of the correct option' })
  @IsNotEmpty()
  @IsString()
  answer: string;

  @ApiProperty({ required: false, description: 'AI-generated difficulty label' })
  @IsOptional()
  @IsString()
  difficulty?: string;
}

export class CreateBulkQuestionsDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  quizId: string;

  @ApiProperty({ type: [BulkQuestionItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkQuestionItemDto)
  questions: BulkQuestionItemDto[];
}
