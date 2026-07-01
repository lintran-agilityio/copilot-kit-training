import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';

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
}
