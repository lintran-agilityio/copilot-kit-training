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
  @ApiOperation({ summary: 'List all rooms' })
  @ApiOkResponse({ type: RoomResponseDto, isArray: true })
  getRooms(): Promise<RoomResponseDto[]> {
    return this.roomsService.getRooms();
  }

  @Get('available')
  @ApiOperation({ summary: 'List rooms available on a given date' })
  @ApiOkResponse({ type: RoomResponseDto, isArray: true })
  getAvailableRooms(
    @Query() query: GetAvailableRoomsQueryDto,
  ): Promise<RoomResponseDto[]> {
    return this.roomsService.getAvailableRooms(query);
  }
}
