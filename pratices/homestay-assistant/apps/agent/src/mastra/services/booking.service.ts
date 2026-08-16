import { z } from "zod";

import { BookingStatus } from "@repo/types";
import { isTimeInFuture, isTimeTodayOrLater, sanitizeBookingId } from "@repo/utils";
import {
  type CheckRoomAvailabilityInput,
  type CreateBookingInput,
  type UpdateBookingInput,
} from "@repo/schemas";
import {
  bookingSchema,
  checkRoomAvailabilityResponseSchema,
  type Booking,
  type FindBookingByIdOutput,
} from "@/mastra/schemas/booking";
import { ROUTES } from "@repo/constants";
import { get, post, del, update, assertClerkTokenForApi } from "@/mastra/services/common";
import type { RequestContext } from "@mastra/core/request-context";
import { getRoom } from "@/mastra/services/rooms.service";
import { BOOKING_ERRORS } from "@/mastra/constants/messages";

export type ServiceContext = {
  requestContext?: RequestContext;
  abortSignal?: AbortSignal;
};

export type CreateBookingPayload = CreateBookingInput;
export type GetBookingsParams = {
  roomId?: string;
  status?: BookingStatus;
  /** YYYY-MM-DD — stays where checkIn <= onDate < checkOut */
  onDate?: string;
};

export const createBooking = async (
  booking: CreateBookingPayload,
  serviceContext?: ServiceContext,
): Promise<Booking> => {
  assertClerkTokenForApi(serviceContext?.requestContext);
  return post(
    ROUTES.BOOKINGS,
    booking,
    bookingSchema,
    "Failed to create booking",
    serviceContext,
  );
};

export const getBookings = async (
  params?: GetBookingsParams,
  serviceContext?: ServiceContext,
): Promise<Booking[]> => {
  assertClerkTokenForApi(serviceContext?.requestContext);
  return get(ROUTES.BOOKINGS, z.array(bookingSchema), {
    searchParams: params,
    errorMessage: "Failed to fetch bookings",
    requestContext: serviceContext?.requestContext,
    abortSignal: serviceContext?.abortSignal,
  });
};

export type CheckRoomAvailabilityApiInput = Omit<
  CheckRoomAvailabilityInput,
  "flow"
>;

export const checkRoomAvailability = async (
  input: CheckRoomAvailabilityApiInput,
  serviceContext?: ServiceContext,
) =>
  get(ROUTES.BOOKING_AVAILABILITY, checkRoomAvailabilityResponseSchema, {
    searchParams: input,
    errorMessage: "Failed to check room availability",
    abortSignal: serviceContext?.abortSignal,
  });

export const updateBooking = async (
  input: UpdateBookingInput,
  serviceContext?: ServiceContext,
): Promise<Booking> => {
  assertClerkTokenForApi(serviceContext?.requestContext);
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
): Promise<Booking> => {
  assertClerkTokenForApi(serviceContext?.requestContext);
  return del(
    `${ROUTES.BOOKINGS}/${encodeURIComponent(sanitizeBookingId(bookingId))}`,
    bookingSchema,
    "Failed to cancel booking",
    serviceContext,
  );
};

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

  return isTimeTodayOrLater(booking.checkOutDate);
};

/**
 * True for an active booking whose stay has not started yet. Once check-in
 * arrives, the stay is in progress (or over) and dates/guests can no longer
 * be modified — only cancellation is allowed.
 */
export const isModifiableBooking = (booking: Booking) =>
  isActiveBooking(booking) && isTimeInFuture(booking.checkInDate);

const loadOwnedBooking = async (
  bookingId: string,
  serviceContext?: ServiceContext,
): Promise<Booking> => {
  assertClerkTokenForApi(serviceContext?.requestContext);
  const id = sanitizeBookingId(bookingId);

  if (!id) {
    throw new Error(BOOKING_ERRORS.NOT_FOUND);
  }

  try {
    return await get<Booking>(
      `${ROUTES.BOOKINGS}/${encodeURIComponent(id)}`,
      bookingSchema,
      {
        errorMessage: "Failed to load booking",
        requestContext: serviceContext?.requestContext,
        abortSignal: serviceContext?.abortSignal,
      },
    );
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }
    throw new Error(BOOKING_ERRORS.NOT_FOUND);
  }
};

/**
 * Load a booking owned by the signed-in user (Nest scopes by JWT) and ensure
 * it is still active (not cancelled / past checkout). Used before cancel.
 */
export const assertOwnedActiveBooking = async (
  bookingId: string,
  serviceContext?: ServiceContext,
): Promise<Booking> => {
  const booking = await loadOwnedBooking(bookingId, serviceContext);

  if (!isActiveBooking(booking)) {
    throw new Error(BOOKING_ERRORS.NOT_FOUND_OR_INACTIVE);
  }

  return booking;
};

/**
 * Load a booking owned by the signed-in user and ensure it can still be
 * modified: active AND check-in has not started yet. Used before update.
 */
export const assertOwnedModifiableBooking = async (
  bookingId: string,
  serviceContext?: ServiceContext,
): Promise<Booking> => {
  const booking = await loadOwnedBooking(bookingId, serviceContext);

  if (!isModifiableBooking(booking)) {
    throw new Error(BOOKING_ERRORS.NOT_MODIFIABLE);
  }

  return booking;
};

export type FindBookingByIdPurpose = "cancel" | "modify";

/**
 * Look up a single owned booking. `purpose: "modify"` additionally requires
 * the stay not to have started yet — an already-checked-in booking comes
 * back empty with `reason: "not_modifiable"` so callers can never resolve an
 * edit form for it (deterministic gate; not left to prompt instructions).
 */
export const findBookingById = async (
  bookingId: string,
  serviceContext?: ServiceContext,
  purpose: FindBookingByIdPurpose = "cancel",
): Promise<FindBookingByIdOutput> => {
  assertClerkTokenForApi(serviceContext?.requestContext);
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
        abortSignal: serviceContext?.abortSignal,
      },
    );

    if (!isActiveBooking(booking)) {
      return { bookings: [], bookingId: id, queryName: "" };
    }

    if (purpose === "modify" && !isModifiableBooking(booking)) {
      return {
        bookings: [],
        bookingId: id,
        queryName: "",
        reason: "not_modifiable",
      };
    }

    const summary = toCancellationSummary(booking);
    const room = await getRoom(booking.roomId, serviceContext);

    return {
      bookings: [summary],
      bookingId: id,
      queryName: summary.roomName,
      room,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }
    return { bookings: [], bookingId: id, queryName: "" };
  }
};
