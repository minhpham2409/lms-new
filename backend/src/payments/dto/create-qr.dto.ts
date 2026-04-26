import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQrDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  orderId: string;

  /** When true, replaces existing pending QR / txn ref. Default: reuse pending payment if any. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  forceRegenerate?: boolean;
}
