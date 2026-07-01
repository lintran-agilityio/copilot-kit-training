import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CheckAvailabilityQueryDto {
  @ApiProperty({
    description: 'Room ID to check',
    example: 'lotus-garden',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  roomId: string;

  @ApiProperty({
    description: 'Check-in date (YYYY-MM-DD)',
    example: '2026-07-01',
  })
  @IsString()
  @IsNotEmpty()
  @IsDateString()
  checkInDate: string;

  @ApiProperty({
    description: 'Check-out date (YYYY-MM-DD)',
    example: '2026-07-03',
  })
  @IsString()
  @IsNotEmpty()
  @IsDateString()
  checkOutDate: string;
}
