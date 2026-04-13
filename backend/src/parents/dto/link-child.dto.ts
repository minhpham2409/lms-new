import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class LinkChildDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  childId: string;
}
