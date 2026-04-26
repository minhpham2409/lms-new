import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class LinkChildDto {
  @ApiPropertyOptional({
    description:
      'Student account: UUID, email, or username (easiest for parents). Case-insensitive for email/username.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(320)
  identifier?: string;

  @ApiPropertyOptional({
    description: 'Deprecated: same as `identifier` when it is a raw user id. Prefer `identifier`.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(320)
  childId?: string;
}
