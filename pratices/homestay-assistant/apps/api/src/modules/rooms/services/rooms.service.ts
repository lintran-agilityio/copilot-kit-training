import { Injectable } from '@nestjs/common';
import {
  addDays,
  isEmptyDateValue,
  resolveDateOrToday,
} from '../../../utils/date.util';
import { GetAvailableRoomsQueryDto } from '../dto/get-available-rooms-query.dto';
import { RoomResponseDto } from '../dto/room-response.dto';
import { RoomsRepository } from '../repositories/rooms.repository';

@Injectable()
export class RoomsService {
  constructor(private readonly roomsRepository: RoomsRepository) {}

  async getRooms(
    query: GetAvailableRoomsQueryDto = {},
  ): Promise<RoomResponseDto[]> {
    if (isEmptyDateValue(query.date)) {
      return this.roomsRepository.findAll();
    }

    const checkInDate = resolveDateOrToday(query.date);
    const checkOutDate = addDays(checkInDate, 1);

    return this.roomsRepository.findAvailableBetween(checkInDate, checkOutDate);
  }
}
