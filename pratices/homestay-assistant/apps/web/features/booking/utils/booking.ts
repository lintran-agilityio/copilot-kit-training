import type { Room } from "@/features/room/types/room";
import type { BookingResponse } from "../types";

export const mappingBookedToRooms = (
  bookings: BookingResponse[],
): Room[] => [
  ...new Map(
    bookings
      .filter((booking): booking is BookingResponse & { room: Room } =>
        booking.room != null,
      )
      .map((booking) => [booking.room.id, booking.room] as const),
  ).values(),
];