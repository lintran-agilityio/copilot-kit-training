import {
  IsNotEmpty,
  IsUUID,
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '../../../types/enum';

export class ListBookingsQueryDto {
  @ApiProperty({
    description: 'Filter by user ID',
    required: false,
    example: 'guest-user',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  userId?: string;

  @ApiProperty({
    description: 'Filter by room ID',
    required: false,
    example: 'lotus-garden',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  roomId?: string;

  @ApiProperty({
    description: 'Filter by booking status',
    enum: BookingStatus,
    required: false,
  })
  @IsEnum(BookingStatus)
  @IsOptional()
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
