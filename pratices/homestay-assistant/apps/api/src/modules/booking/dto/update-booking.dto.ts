import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '../../../types/enum';

export class UpdateBookingDto {
  @ApiProperty({
    description: 'Check-in date (YYYY-MM-DD)',
    example: '2026-07-01',
    required: false,
  })
  checkInDate?: string;

  @ApiProperty({
    description: 'Check-out date (YYYY-MM-DD)',
    example: '2026-07-03',
    required: false,
  })
  checkOutDate?: string;

  @ApiProperty({
    description: 'Number of guests',
    example: 2,
    minimum: 1,
    required: false,
  })
  guests?: number;

  @ApiProperty({
    description: 'Booking status',
    enum: BookingStatus,
    required: false,
  })
  status?: BookingStatus;
}
