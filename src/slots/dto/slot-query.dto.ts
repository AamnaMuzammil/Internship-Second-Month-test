import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class SlotQueryDto extends PaginationQueryDto {
  @IsOptional() @IsDateString() date?: string; // e.g. 2026-10-08 (UTC day)

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  available?: boolean;
}