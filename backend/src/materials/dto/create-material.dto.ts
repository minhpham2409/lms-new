import { IsNotEmpty, IsString, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMaterialDto {
  @ApiProperty({ example: 'React Hooks Cheatsheet' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'Quick reference for React Hooks', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'https://storage.example.com/files/react-hooks.pdf' })
  @IsNotEmpty()
  @IsString()
  fileUrl: string;

  @ApiProperty({ example: 'pdf' })
  @IsNotEmpty()
  @IsString()
  fileType: string;

  @ApiProperty({ example: 1024000 })
  @IsNotEmpty()
  @IsInt()
  @Min(0)
  fileSize: number;

  @ApiProperty({ example: 'uuid-lesson-id' })
  @IsNotEmpty()
  @IsString()
  lessonId: string;
}
