import { ApiProperty } from '@nestjs/swagger';

export class CheckAvailabilityQueryDto {
  @ApiProperty({
    description: 'Room ID to check',
    example: 'lotus-garden',
  })
  roomId: string;

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
}
