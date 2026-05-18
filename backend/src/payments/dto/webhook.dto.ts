import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Internal webhook DTO used by the payment processor.
 * Bank providers (SePay, Casso, etc.) are adapted to this format
 * by the controller before calling handleWebhook().
 */
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

/**
 * SePay webhook payload — matches the real format from https://my.sepay.vn
 * SePay sends a POST to your configured webhook URL when a bank transfer is detected.
 *
 * Docs: https://docs.sepay.vn/webhook.html
 */
export class SepayWebhookDto {
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) id?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() gateway?: string;
  @ApiProperty() @IsNotEmpty() @IsString() transactionDate: string;
  @ApiPropertyOptional() @IsOptional() @IsString() accountNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() subAccount?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() code?: string;
  @ApiProperty() @IsNotEmpty() @IsString() content: string;
  @ApiProperty() @IsNumber() @Type(() => Number) transferAmount: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) accumulated?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() referenceCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiProperty() @IsNotEmpty() @IsString() transferType: string; // 'in' or 'out'
}
