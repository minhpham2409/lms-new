import { IsOptional, IsInt, Min, Max, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * Standard pagination DTO for all list endpoints.
 * Usage: Add `@Query() query: PaginationQueryDto` to any controller method
 * that returns a paginated list.
 */
export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  /** Computed skip value for Prisma */
  get skip(): number {
    return ((this.page ?? 1) - 1) * (this.limit ?? 20);
  }

  /** Computed take value for Prisma */
  get take(): number {
    return this.limit ?? 20;
  }
}
