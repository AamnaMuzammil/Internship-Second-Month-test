import { AppointmentStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class AppointmentQueryDto extends PaginationQueryDto {
  @IsOptional() @IsEnum(AppointmentStatus) status?: AppointmentStatus;
}