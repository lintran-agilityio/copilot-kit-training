import type { Room } from "@/features/room/types/room";
import type { BookingResponse } from "../types";

export const mappingBookedToRooms = (
  bookings: BookingResponse[],
  rooms: Room[],
): Room[] => {
  const roomsById = new Map(rooms.map((room) => [room.id, room]));

  return [
    ...new Map(
      bookings
        .map((booking) => roomsById.get(booking.roomId))
        .filter((room): room is Room => room != null)
        .map((room) => [room.id, room] as const),
    ).values(),
  ];
};