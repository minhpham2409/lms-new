import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AddToCartDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  courseId: string;
}
