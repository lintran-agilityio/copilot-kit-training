import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '../../../types/enum';

export class ListBookingsQueryDto {
  @ApiProperty({
    description: 'Filter by user ID',
    required: false,
    example: 'guest-user',
  })
  userId?: string;

  @ApiProperty({
    description: 'Filter by room ID',
    required: false,
    example: 'lotus-garden',
  })
  roomId?: string;

  @ApiProperty({
    description: 'Filter by booking status',
    enum: BookingStatus,
    required: false,
  })
  status?: BookingStatus;
}
