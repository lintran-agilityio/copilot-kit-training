import { Injectable, NotFoundException } from '@nestjs/common';
import {
  addDays,
  isEmptyDateValue,
  parseDateRange,
  resolveDateOrToday,
  toDateKey,
} from '../../../utils';
import {
  GetRoomByIdQueryDto,
  GetAvailableRoomsQueryDto,
  RoomResponseDto,
} from '../dto';
import { toRoomResponseDto } from '../mappers/room.mapper';
import { RoomsRepository } from '../repositories/rooms.repository';

@Injectable()
export class RoomsService {
  constructor(private readonly roomsRepository: RoomsRepository) {}

  async getRooms(
    query: GetAvailableRoomsQueryDto = {},
  ): Promise<RoomResponseDto[]> {
    if (isEmptyDateValue(query.date)) {
      const rooms = await this.roomsRepository.findAll();
      return rooms.map(toRoomResponseDto);
    }

    const checkInDate = resolveDateOrToday(query.date);
    const checkOutDate = addDays(checkInDate, 1);

    const rooms = await this.roomsRepository.findAvailableBetween(
      checkInDate,
      checkOutDate,
    );
    return rooms.map(toRoomResponseDto);
  }

  async getRoomById(
    id: string,
    query: GetRoomByIdQueryDto = {},
  ): Promise<RoomResponseDto> {
    const room = await this.roomsRepository.findById(id, query.userId);
    if (!room) {
      throw new NotFoundException(`Room with id "${id}" not found`);
    }

    const response = toRoomResponseDto(room);

    const activeBooking = room.bookings?.[0];
    if (activeBooking) {
      response.bookingStatus = activeBooking.status;
      response.checkInDate = activeBooking.checkInDate;
      response.checkOutDate = activeBooking.checkOutDate;
    }

    if (query.checkInDate && query.checkOutDate) {
      const { checkInDate, checkOutDate } = parseDateRange(
        query.checkInDate,
        query.checkOutDate,
      );

      const hasOverlap = await this.roomsRepository.hasOverlappingActiveBooking(
        id,
        toDateKey(checkInDate),
        toDateKey(checkOutDate),
      );

      response.available = room.availableSlots > 0 && !hasOverlap;
    }

    return response;
  }
}
