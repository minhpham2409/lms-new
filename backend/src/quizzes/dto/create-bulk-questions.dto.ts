import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class BulkQuestionItemDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({ description: 'Array of strings' })
  @IsArray()
  @IsString({ each: true })
  options: string[];

  @ApiProperty({ description: 'Exact text of the correct option' })
  @IsNotEmpty()
  @IsString()
  answer: string;
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
