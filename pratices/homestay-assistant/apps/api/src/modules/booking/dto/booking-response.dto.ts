import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '../../../types/enum';

export class BookingRoomSummaryDto {
  @ApiProperty({ example: 'lotus-garden' })
  id: string;

  @ApiProperty({ example: 'Lotus Garden Room' })
  name: string;

  @ApiProperty({ example: 750_000 })
  pricePerNight: number;

  @ApiProperty({ example: 2 })
  capacity: number;
}

export class BookingResponseDto {
  @ApiProperty({
    description: 'Booking ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({ example: 'guest-user' })
  userId: string;

  @ApiProperty({ example: 'lotus-garden' })
  roomId: string;

  @ApiProperty({ example: '2026-07-01' })
  checkInDate: string;

  @ApiProperty({ example: '2026-07-03' })
  checkOutDate: string;

  @ApiProperty({ example: 2 })
  guests: number;

  @ApiProperty({ example: 1_500_000 })
  totalPrice: number;

  @ApiProperty({ enum: BookingStatus, example: BookingStatus.PENDING })
  status: BookingStatus;

  @ApiProperty({ type: BookingRoomSummaryDto, required: false })
  room?: BookingRoomSummaryDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
