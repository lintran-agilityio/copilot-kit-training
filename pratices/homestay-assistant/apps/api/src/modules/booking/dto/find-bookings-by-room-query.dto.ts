import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class FindBookingsByRoomQueryDto {
  @ApiProperty({
    description: 'User ID whose bookings to search',
    example: 'guest-user',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Room display name to look up (partial matches are supported)',
    example: 'Bamboo Family Suite',
  })
  @IsString()
  roomName: string;
}
