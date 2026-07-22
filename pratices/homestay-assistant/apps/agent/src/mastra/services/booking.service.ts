import { z } from "zod";

import { BookingStatus } from "@repo/types";
import { sanitizeBookingId } from "@repo/utils";
import {
  bookingSchema,
  checkRoomAvailabilityOutputSchema,
  type Booking,
  type CheckRoomAvailabilityInput,
  type CreateBookingPayload,
  type FindBookingByIdOutput,
  type UpdateBookingSchema,
} from "@/mastra/schemas/booking";
import { ROUTES } from "@repo/constants";
import { get, post, del, update } from "@/mastra/services/common";
import { getRoom } from "@/mastra/services/rooms.service";

export type GetBookingsParams = {
  userId?: string;
  roomId?: string;
  status?: BookingStatus;
};

export const createBooking = async (
  booking: CreateBookingPayload,
): Promise<Booking> =>
  post(ROUTES.BOOKINGS, booking, bookingSchema, "Failed to create booking");

export const getBookings = async (
  params?: GetBookingsParams
): Promise<Booking[]> =>
  get(ROUTES.BOOKINGS, z.array(bookingSchema), {
    searchParams: params,
    errorMessage: "Failed to fetch bookings",
  });

export const checkRoomAvailability = async (
  input: CheckRoomAvailabilityInput
) =>
  get(ROUTES.BOOKING_AVAILABILITY, checkRoomAvailabilityOutputSchema, {
    searchParams: input,
    errorMessage: "Failed to check room availability",
  });

export const updateBooking = async (
  input: UpdateBookingSchema,
): Promise<Booking> => {
  const bookingId = sanitizeBookingId(input.bookingId);

  return update(
    `${ROUTES.BOOKINGS}/${encodeURIComponent(bookingId)}`,
    {
      checkInDate: input.checkInDate,
      checkOutDate: input.checkOutDate,
      guests: input.guests,
    },
    bookingSchema,
    "Failed to update booking",
  );
};

export const cancelBooking = async (bookingId: string): Promise<Booking> =>
  del(
    `${ROUTES.BOOKINGS}/${encodeURIComponent(sanitizeBookingId(bookingId))}`,
    bookingSchema,
    "Failed to cancel booking"
  );

const toCancellationSummary = (booking: Booking) => ({
  bookingId: booking.id,
  roomId: booking.roomId,
  roomName: booking.room?.name ?? "",
  checkInDate: booking.checkInDate,
  checkOutDate: booking.checkOutDate,
  guests: booking.guests,
  totalPrice: booking.totalPrice,
});

const isActiveBooking = (booking: Booking) => {
  const status = booking.status.toUpperCase();

  if (status === BookingStatus.CANCELLED) {
    return false;
  }

  if (status !== BookingStatus.PENDING && status !== BookingStatus.CONFIRMED) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const checkout = new Date(`${booking.checkOutDate}T00:00:00`);
  return checkout >= today;
};

export const findBookingById = async (
  userId: string,
  bookingId: string,
): Promise<FindBookingByIdOutput> => {
  const id = sanitizeBookingId(bookingId);

  if (!id) {
    return { bookings: [], bookingId: "", queryName: "" };
  }

  try {
    const booking = await get<Booking>(
      `${ROUTES.BOOKINGS}/${encodeURIComponent(id)}`,
      bookingSchema,
      {
        errorMessage: "Failed to find booking by id",
      },
    );

    if (booking.userId !== userId || !isActiveBooking(booking)) {
      return { bookings: [], bookingId: id, queryName: "" };
    }

    const summary = toCancellationSummary(booking);
    const room = await getRoom(booking.roomId);

    return {
      bookings: [summary],
      bookingId: id,
      queryName: summary.roomName,
      room,
    };
  } catch {
    return { bookings: [], bookingId: id, queryName: "" };
  }
};
