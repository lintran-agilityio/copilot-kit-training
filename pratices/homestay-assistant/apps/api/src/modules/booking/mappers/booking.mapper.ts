import { toRoomResponseDto } from '../../rooms/mappers/room.mapper';
import { BookingEntity } from '../entities/booking.entity';
import { BookingResponseDto } from '../dto/booking-response.dto';

export const toBookingResponseDto = (
  booking: BookingEntity,
): BookingResponseDto => {
  const response: BookingResponseDto = {
    id: booking.id,
    userId: booking.userId,
    roomId: booking.roomId,
    checkInDate: booking.checkInDate,
    checkOutDate: booking.checkOutDate,
    guests: booking.guests,
    totalPrice: booking.totalPrice,
    status: booking.status,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
  };

  if (booking.room) {
    response.room = toRoomResponseDto(booking.room);
  }

  return response;
};
