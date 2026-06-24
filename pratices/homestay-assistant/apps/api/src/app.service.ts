import { Injectable } from '@nestjs/common';
import { GetAvailableRoomsQueryDto } from './modules/rooms/dto/get-available-rooms-query.dto';
import { RoomResponseDto } from './modules/rooms/dto/room-response.dto';
import { RoomsService } from './modules/rooms/services/rooms.service';

@Injectable()
export class AppService {
  constructor(private readonly roomsService: RoomsService) {}

  getHello(): string {
    return 'Homestay Assistant API';
  }

  getAvailableRooms(
    query: GetAvailableRoomsQueryDto = {},
  ): Promise<RoomResponseDto[]> {
    return this.roomsService.getAvailableRooms(query);
  }
}
