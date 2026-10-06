import { IsInt, IsOptional } from 'class-validator';

export class UpdateAppointmentDto {
  @IsOptional() @IsInt() slotId?: number;
  @IsOptional() @IsInt() serviceId?: number;
}