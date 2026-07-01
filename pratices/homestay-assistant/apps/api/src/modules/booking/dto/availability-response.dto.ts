import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsString,
  IsUUID,
  IsBoolean,
} from 'class-validator';

export class AvailabilityResponseDto {
  @ApiProperty({
    description: 'Whether the room is available for the requested dates',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  available: boolean;

  @ApiProperty({
    description: 'Room ID that was checked',
    example: 'lotus-garden',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  roomId: string;

  @ApiProperty({
    description: 'Requested check-in date',
    example: '2026-07-01',
  })
  @IsString()
  @IsNotEmpty()
  @IsDateString()
  checkInDate: string;

  @ApiProperty({
    description: 'Requested check-out date',
    example: '2026-07-03',
  })
  @IsString()
  @IsNotEmpty()
  @IsDateString()
  checkOutDate: string;
}
