import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  couponCode?: string;
}
