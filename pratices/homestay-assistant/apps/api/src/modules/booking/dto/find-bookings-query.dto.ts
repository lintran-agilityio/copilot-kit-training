import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class FindBookingsQueryDto {
  @ApiProperty({
    description: 'Case-insensitive partial room-name match',
    required: false,
    example: 'Misty Pavilion',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  roomName?: string;
}
