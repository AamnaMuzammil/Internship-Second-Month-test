import { IsDateString } from 'class-validator';

export class CreateSlotDto {
  @IsDateString() startTime: string;
  @IsDateString() endTime: string;
}