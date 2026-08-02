import { z } from "zod";

import { BookingStatus } from "@repo/types";
import { sanitizeBookingId } from "@repo/utils";
import {
  bookingSchema,
  checkRoomAvailabilityResponseSchema,
  type Booking,
  type CheckRoomAvailabilityInput,
  type CreateBookingPayload,
  type FindBookingByIdOutput,
  type UpdateBookingSchema,
} from "@/mastra/schemas/booking";
import { ROUTES } from "@repo/constants";
import { get, post, del, update } from "@/mastra/services/common";
import type { RequestContext } from "@mastra/core/request-context";
import { getRoom } from "@/mastra/services/rooms.service";

type ServiceContext = {
  requestContext?: RequestContext;
};

export type GetBookingsParams = {
  userId?: string;
  roomId?: string;
  status?: BookingStatus;
};

export const createBooking = async (
  booking: CreateBookingPayload,
  serviceContext?: ServiceContext,
): Promise<Booking> =>
  post(
    ROUTES.BOOKINGS,
    booking,
    bookingSchema,
    "Failed to create booking",
    serviceContext,
  );

export const getBookings = async (
  params?: GetBookingsParams,
  serviceContext?: ServiceContext,
): Promise<Booking[]> =>
  get(ROUTES.BOOKINGS, z.array(bookingSchema), {
    searchParams: params,
    errorMessage: "Failed to fetch bookings",
    requestContext: serviceContext?.requestContext,
  });

export type CheckRoomAvailabilityApiInput = Omit<
  CheckRoomAvailabilityInput,
  "flow"
>;

export const checkRoomAvailability = async (
  input: CheckRoomAvailabilityApiInput,
) =>
  get(ROUTES.BOOKING_AVAILABILITY, checkRoomAvailabilityResponseSchema, {
    searchParams: input,
    errorMessage: "Failed to check room availability",
  });

export const updateBooking = async (
  input: UpdateBookingSchema,
  serviceContext?: ServiceContext,
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
    serviceContext,
  );
};

export const cancelBooking = async (
  bookingId: string,
  serviceContext?: ServiceContext,
): Promise<Booking> =>
  del(
    `${ROUTES.BOOKINGS}/${encodeURIComponent(sanitizeBookingId(bookingId))}`,
    bookingSchema,
    "Failed to cancel booking",
    serviceContext,
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

export const isActiveBooking = (booking: Booking) => {
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

/**
 * Load a booking and ensure it belongs to the signed-in user and is still
 * active (not cancelled / past checkout). Used before cancel/update.
 */
export const assertOwnedActiveBooking = async (
  userId: string,
  bookingId: string,
  serviceContext?: ServiceContext,
): Promise<Booking> => {
  const id = sanitizeBookingId(bookingId);

  if (!id) {
    throw new Error("Booking not found");
  }

  let booking: Booking;

  try {
    booking = await get<Booking>(
      `${ROUTES.BOOKINGS}/${encodeURIComponent(id)}`,
      bookingSchema,
      {
        errorMessage: "Failed to load booking",
        requestContext: serviceContext?.requestContext,
      },
    );
  } catch {
    throw new Error("Booking not found");
  }

  if (booking.userId !== userId || !isActiveBooking(booking)) {
    throw new Error("Booking not found or no longer active");
  }

  return booking;
};

export const findBookingById = async (
  userId: string,
  bookingId: string,
  serviceContext?: ServiceContext,
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
        requestContext: serviceContext?.requestContext,
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
