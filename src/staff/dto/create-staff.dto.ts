import { ArrayNotEmpty, IsArray, IsInt, IsString, MinLength } from 'class-validator';

export class CreateStaffDto {
  @IsString() @MinLength(2) name: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  serviceIds: number[];
}