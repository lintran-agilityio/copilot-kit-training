import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '../../../types/enum';

export class CreateBookingDto {
  @ApiProperty({
    description: 'Room ID to book',
    example: 'lotus-garden',
  })
  roomId: string;

  @ApiProperty({
    description: 'User ID making the booking',
    example: 'guest-user',
  })
  userId: string;

  @ApiProperty({
    description: 'Check-in date (YYYY-MM-DD)',
    example: '2026-07-01',
  })
  checkInDate: string;

  @ApiProperty({
    description: 'Check-out date (YYYY-MM-DD)',
    example: '2026-07-03',
  })
  checkOutDate: string;

  @ApiProperty({
    description: 'Number of guests',
    example: 2,
    minimum: 1,
  })
  guests: number;

  @ApiProperty({
    description: 'Initial booking status',
    enum: BookingStatus,
    required: false,
    default: BookingStatus.PENDING,
  })
  status?: BookingStatus;
}
