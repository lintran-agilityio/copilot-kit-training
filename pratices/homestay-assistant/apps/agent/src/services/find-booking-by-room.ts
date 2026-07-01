import {
  BookingStatus,
  type BookingByRoomLookup,
  type CancellationBookingSummary,
} from "@repo/types";
import { matchesRoomName } from "@repo/utils";
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
): Promise<BookingByRoomLookup> => {
  const queryName = roomName.trim();

  if (!queryName) {
    return { bookings: [], queryName: "" };
  }

  const bookings = await getBookings({ userId });
  const activeBookings = bookings.filter((booking) =>
    isActiveBooking(booking.status),
  );

  const matches = activeBookings
    .map((booking) => {
      const name = booking.room?.name;

      if (!name || !matchesRoomName(name, queryName)) {
        return null;
      }

      return toCancellationSummary(booking, name);
    })
    .filter((match): match is CancellationBookingSummary => match != null);

  return { bookings: matches, queryName };
};
