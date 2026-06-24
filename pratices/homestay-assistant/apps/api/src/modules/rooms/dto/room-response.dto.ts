import { ApiProperty } from '@nestjs/swagger';
import { Amenity } from '../../../database/entities/enums';

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
}
