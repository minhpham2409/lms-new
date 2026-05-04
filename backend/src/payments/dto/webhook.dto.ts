import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class WebhookDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  txnRef: string;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  status: string;

  @ApiPropertyOptional({ description: 'HMAC-SHA256 signature from bank for verification' })
  @IsOptional()
  @IsString()
  signature?: string;
}
