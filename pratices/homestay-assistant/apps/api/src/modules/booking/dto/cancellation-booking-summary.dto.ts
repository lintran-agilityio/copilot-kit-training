import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export class CancellationBookingSummaryDto {
  @ApiProperty({
    description: 'Booking ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  bookingId: string;

  @ApiProperty({
    description: 'Room ID associated with the booking',
    example: 'lotus-garden',
  })
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @ApiProperty({ example: 'Bamboo Family Suite' })
  @IsString()
  @IsNotEmpty()
  roomName: string;

  @ApiProperty({ example: '2026-07-01' })
  @IsString()
  @IsNotEmpty()
  @IsDateString()
  checkInDate: string;

  @ApiProperty({ example: '2026-07-03' })
  @IsString()
  @IsNotEmpty()
  @IsDateString()
  checkOutDate: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @IsPositive()
  guests: number;

  @ApiProperty({ example: 1_500_000 })
  @IsNumber()
  @IsPositive()
  totalPrice: number;
}
