import { IsInt } from 'class-validator';

export class CreateAppointmentDto {
  @IsInt() serviceId: number;
  @IsInt() slotId: number;
}