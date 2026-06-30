import { ApiProperty } from '@nestjs/swagger';
import { Amenity } from '../../../database/entities/enums';
import { BookingStatus } from '../../../types/enum';

export class RoomResponseDto {
  @ApiProperty({
    description: 'Room ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Room name',
    example: 'Room 1',
  })
  name: string;

  @ApiProperty({
    description: 'Room level',
    example: 1,
  })
  level: number;

  @ApiProperty({
    description: 'Room level color',
    example: '#f0f0f0',
  })
  levelColor: string;

  @ApiProperty({
    description: 'Room capacity',
    example: 1,
  })
  capacity: number;

  @ApiProperty({
    description: 'Room description',
    example: 'Room 1 description',
  })
  description: string;

  @ApiProperty({
    description: 'Room image URL',
    example: 'https://example.com/image.jpg',
  })
  imageUrl: string;

  @ApiProperty({
    description: 'Room available slots',
    example: 1,
  })
  availableSlots: number;

  @ApiProperty({
    description: 'Room price per night',
    example: 100,
  })
  pricePerNight: number;

  @ApiProperty({
    description:
      'Active booking status for the requested user on this room, when userId is provided',
    enum: BookingStatus,
    required: false,
    example: BookingStatus.CONFIRMED,
  })
  bookingStatus?: BookingStatus;

  @ApiProperty({
    description:
      'Whether the room is available for the requested date range, when checkInDate and checkOutDate are provided',
    required: false,
    example: true,
  })
  available?: boolean;

  @ApiProperty({
    description: 'Room amenities',
    example: [
      Amenity.MONITOR,
      Amenity.COFFEE,
      Amenity.WIFI,
      Amenity.WHITEBOARD,
    ],
    enum: Amenity,
    isArray: true,
  })
  amenities: Amenity[];

  @ApiProperty({
    description: 'Check-in date of the active booking',
    example: '2026-07-01',
    required: false,
  })
  checkInDate?: string;

  @ApiProperty({
    description: 'Check-out date of the active booking',
    example: '2026-07-03',
    required: false,
  })
  checkOutDate?: string;
}
