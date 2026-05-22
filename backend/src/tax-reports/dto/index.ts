import { IsInt, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class MonthlyReportDto {
  @IsInt() @Min(2020) @Max(2100) @Type(() => Number) year: number;
  @IsInt() @Min(1) @Max(12) @Type(() => Number) month: number;
}

export class QuarterlyReportDto {
  @IsInt() @Min(2020) @Max(2100) @Type(() => Number) year: number;
  @IsInt() @Min(1) @Max(4) @Type(() => Number) quarter: number;
}

export class CourseStudentsDto {
  @IsOptional() courseId?: string;
  @IsInt() @Min(2020) @Max(2100) @Type(() => Number) year: number;
  @IsInt() @Min(1) @Max(12) @Type(() => Number) month: number;
}

export class ExportReportDto {
  @IsInt() @Min(2020) @Max(2100) @Type(() => Number) year: number;
  @IsOptional() @IsInt() @Min(1) @Max(4) @Type(() => Number) quarter?: number;
  @IsOptional() @IsInt() @Min(1) @Max(12) @Type(() => Number) month?: number;
  @IsOptional() teacherId?: string;
}
