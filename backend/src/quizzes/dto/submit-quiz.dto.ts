import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AnswerItemDto {
  questionId: string;
  answerId: string;
}

export class SubmitQuizDto {
  @ApiProperty({ description: 'Array of {questionId, answerId}' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerItemDto)
  answers: AnswerItemDto[];
}
