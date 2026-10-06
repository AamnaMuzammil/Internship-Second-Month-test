import { IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateServiceDto {
  @IsString() @MinLength(2) name: string;
  @IsOptional() @IsString() description?: string;
  @IsInt() @Min(5) durationMin: number;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) price: number;
}