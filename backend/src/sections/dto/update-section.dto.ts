import { PartialType } from '@nestjs/swagger';
import { CreateSectionDto } from './create-section.dto';
import { IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSectionDto extends PartialType(CreateSectionDto) {
  @ApiProperty({ example: 2, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;
}
