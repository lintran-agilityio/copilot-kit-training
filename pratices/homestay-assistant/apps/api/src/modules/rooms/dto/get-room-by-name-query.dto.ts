import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetRoomByNameQueryDto {
  @ApiProperty({
    description: 'Room display name to look up (partial matches are supported)',
    example: 'The Observatory',
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}
