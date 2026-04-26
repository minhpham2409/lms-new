import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'john_doe' })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ example: 'Doe', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: 'student', required: false, enum: ['student', 'teacher', 'parent'] })
  @IsOptional()
  @IsString()
  @IsIn(['student', 'teacher', 'parent'])
  role?: string;
}
