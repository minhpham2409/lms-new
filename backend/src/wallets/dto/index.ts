import { IsNotEmpty, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class RequestPayoutDto {
  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(0.01, { message: 'Amount must be greater than 0' })
  @Type(() => Number)
  amount: number;
}

export class UpdateBankInfoDto {
  @IsString()
  @IsNotEmpty({ message: 'Bank name is required' })
  bankName: string;

  @IsString()
  @IsNotEmpty({ message: 'Bank account is required' })
  bankAccount: string;

  @IsString()
  @IsNotEmpty({ message: 'Bank owner name is required' })
  bankOwner: string;
}

export class RejectPayoutDto {
  @IsString()
  adminNote?: string;
}

export class UpdatePlatformFeeDto {
  @IsNumber()
  @Min(0, { message: 'Fee percentage must be at least 0' })
  @Type(() => Number)
  percentage: number;
}
