import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '../../../types/enum';

export class ListBookingsQueryDto {
  @ApiProperty({
    description: 'Filter by room ID',
    required: false,
    example: 'lotus-garden',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  roomId?: string;

  @ApiProperty({
    description: 'Filter by booking status',
    enum: BookingStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiProperty({
    description:
      'Return active bookings whose stay includes this date (checkIn <= onDate < checkOut). YYYY-MM-DD.',
    required: false,
    example: '2026-08-15',
  })
  @IsOptional()
  @IsString()
  @IsDateString()
  onDate?: string;
}
