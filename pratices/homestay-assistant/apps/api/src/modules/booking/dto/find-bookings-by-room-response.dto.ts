import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { CancellationBookingSummaryDto } from '@/modules/booking/dto/cancellation-booking-summary.dto';

export class FindBookingsByRoomResponseDto {
  @ApiProperty({ type: CancellationBookingSummaryDto, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CancellationBookingSummaryDto)
  bookings: CancellationBookingSummaryDto[];

  @ApiProperty({
    description: 'Trimmed room name from the query',
    example: 'Bamboo Family Suite',
  })
  @IsString()
  queryName: string;
}
