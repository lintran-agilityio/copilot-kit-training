import { BookingEntity } from '../entities/booking.entity';
import {
  BookingResponseDto,
  BookingRoomSummaryDto,
} from '../dto/booking-response.dto';

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
    const room: BookingRoomSummaryDto = {
      id: booking.room.id,
      name: booking.room.name,
      pricePerNight: booking.room.pricePerNight,
      capacity: booking.room.capacity,
    };
    response.room = room;
  }

  return response;
};
