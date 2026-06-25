import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { GetAvailableRoomsQueryDto } from '../dto/get-available-rooms-query.dto';
import { RoomResponseDto } from '../dto/room-response.dto';
import { RoomsService } from '../services/rooms.service';

@ApiTags('rooms')
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  @ApiOperation({
    summary: 'List all rooms, or rooms available on a given date',
  })
  @ApiOkResponse({ type: RoomResponseDto, isArray: true })
  getRooms(
    @Query() query: GetAvailableRoomsQueryDto,
  ): Promise<RoomResponseDto[]> {
    return this.roomsService.getRooms(query);
  }
}
