import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateCertificateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  courseId: string;
}
