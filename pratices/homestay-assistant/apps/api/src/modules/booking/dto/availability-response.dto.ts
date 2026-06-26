import { ApiProperty } from '@nestjs/swagger';

export class AvailabilityResponseDto {
  @ApiProperty({
    description: 'Whether the room is available for the requested dates',
    example: true,
  })
  available: boolean;

  @ApiProperty({
    description: 'Room ID that was checked',
    example: 'lotus-garden',
  })
  roomId: string;

  @ApiProperty({
    description: 'Requested check-in date',
    example: '2026-07-01',
  })
  checkInDate: string;

  @ApiProperty({
    description: 'Requested check-out date',
    example: '2026-07-03',
  })
  checkOutDate: string;
}
