import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class GetAvailableRoomsQueryDto {
  @ApiProperty({
    description: 'Target date for availability (YYYY-MM-DD)',
    example: '2026-07-01',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsDateString()
  date?: string;

  @ApiProperty({
    description: 'Partial room name search (case-insensitive)',
    example: 'lotus',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description:
      'Party size — matches rooms where capacity >= guests (not exact equality). Larger rooms are included; results prefer the smallest sufficient capacity.',
    example: 2,
    required: false,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  guests?: number;

  @ApiProperty({
    description: 'Room floor level',
    example: 1,
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  level?: number;
}
