import { z } from "zod";

import { BookingStatus } from "@repo/types";
import {
  bookingSchema,
  checkRoomAvailabilityOutputSchema,
  type Booking,
  type CheckRoomAvailabilityInput,
  type CreateBookingSchema,
} from "../mastra/schemas/booking";
import { ROUTES } from "@repo/constants";
import { get, post, del } from "./common";

export type GetBookingsParams = {
  userId?: string;
  roomId?: string;
  status?: BookingStatus;
};

export const createBooking = async (
  booking: CreateBookingSchema
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

export const cancelBooking = async (bookingId: string): Promise<Booking> =>
  del(
    `${ROUTES.BOOKINGS}/${encodeURIComponent(bookingId)}`,
    bookingSchema,
    "Failed to cancel booking"
  );
