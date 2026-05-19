import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateRefundRequestDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  amount: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  bankName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  bankAccount: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  bankOwner: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
