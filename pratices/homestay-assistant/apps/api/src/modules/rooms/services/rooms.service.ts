import { Injectable } from '@nestjs/common';
import { addDays, resolveDateOrToday } from '../../../utils/date.util';
import { GetAvailableRoomsQueryDto } from '../dto/get-available-rooms-query.dto';
import { RoomResponseDto } from '../dto/room-response.dto';
import { RoomsRepository } from '../repositories/rooms.repository';

@Injectable()
export class RoomsService {
  constructor(private readonly roomsRepository: RoomsRepository) {}

  async getRooms(): Promise<RoomResponseDto[]> {
    const rooms = await this.roomsRepository.findAll();
    return rooms;
  }

  async getAvailableRooms(
    query: GetAvailableRoomsQueryDto,
  ): Promise<RoomResponseDto[]> {
    const checkInDate = resolveDateOrToday(query.date);
    const checkOutDate = addDays(checkInDate, 1);

    const rooms = await this.roomsRepository.findAvailableBetween(
      checkInDate,
      checkOutDate,
    );

    return rooms;
  }
}
