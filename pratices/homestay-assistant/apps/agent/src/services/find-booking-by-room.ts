import {
  BookingStatus,
  type CancellationBookingSummary,
  type FindBookingByRoomResult,
} from "@repo/types";

import { getBookings } from "./booking.services";

type BookingWithRoom = {
  id: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  totalPrice: number;
  status: string;
  room?: { name?: string };
};

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

const toCancellationSummary = (
  booking: BookingWithRoom,
  roomName: string,
): CancellationBookingSummary => ({
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

  const bookings = await getBookings({ userId });
  const activeBookings = bookings.filter((booking) =>
    isActiveBooking(booking.status),
  );

  const matches = activeBookings
    .map((booking) => {
      const name = booking.room?.name;

      if (!name || !matchesRoomName(name, trimmedRoomName)) {
        return null;
      }

      return toCancellationSummary(booking, name);
    })
    .filter((match): match is CancellationBookingSummary => match != null);

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
