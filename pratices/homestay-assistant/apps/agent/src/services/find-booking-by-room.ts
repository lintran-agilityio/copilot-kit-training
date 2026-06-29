import { BookingStatus } from "@repo/types";

import type { Booking } from "../mastra/schemas/booking";
import { getBookings } from "./booking.services";
import { getRooms } from "./rooms.service";

export type CancellationBookingMatch = {
  bookingId: string;
  roomName: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  totalPrice: number;
};

export type FindBookingByRoomResult =
  | { status: "found"; booking: CancellationBookingMatch }
  | { status: "not_found"; message: string }
  | { status: "ambiguous"; bookings: CancellationBookingMatch[]; message: string };

const normalizeRoomName = (name: string) => name.trim().toLowerCase();

const matchesRoomName = (roomName: string, query: string) => {
  const normalizedRoom = normalizeRoomName(roomName);
  const normalizedQuery = normalizeRoomName(query);

  return (
    normalizedRoom === normalizedQuery ||
    normalizedRoom.includes(normalizedQuery) ||
    normalizedQuery.includes(normalizedRoom)
  );
};

const isActiveBooking = (status: string) => status !== BookingStatus.CANCELLED;

const toCancellationMatch = (
  booking: Booking,
  roomName: string,
): CancellationBookingMatch => ({
  bookingId: booking.id,
  roomName,
  checkInDate: booking.checkInDate,
  checkOutDate: booking.checkOutDate,
  guests: booking.guests,
  totalPrice: booking.totalPrice,
});

export const findBookingByRoomName = async (
  userId: string,
  roomName: string,
): Promise<FindBookingByRoomResult> => {
  const trimmedRoomName = roomName.trim();

  if (!trimmedRoomName) {
    return {
      status: "not_found",
      message: "Room name is required to find a booking to cancel.",
    };
  }

  const [bookings, rooms] = await Promise.all([
    getBookings({ userId }),
    getRooms(),
  ]);

  const roomsById = new Map(rooms.map((room) => [room.id, room.name]));
  const activeBookings = bookings.filter((booking) =>
    isActiveBooking(booking.status),
  );

  const matches = activeBookings
    .map((booking) => {
      const name = booking.room?.name ?? roomsById.get(booking.roomId);

      if (!name || !matchesRoomName(name, trimmedRoomName)) {
        return null;
      }

      return toCancellationMatch(booking, name);
    })
    .filter((match): match is CancellationBookingMatch => match != null);

  if (matches.length === 0) {
    return {
      status: "not_found",
      message: `No active booking found for room "${trimmedRoomName}".`,
    };
  }

  if (matches.length === 1) {
    const booking = matches[0];
    if (!booking) {
      return {
        status: "not_found",
        message: `No active booking found for room "${trimmedRoomName}".`,
      };
    }

    return { status: "found", booking };
  }

  return {
    status: "ambiguous",
    bookings: matches,
    message: `Multiple active bookings found for "${trimmedRoomName}". Ask which dates to cancel.`,
  };
};
