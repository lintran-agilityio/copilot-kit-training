import { BookingStatus } from "@repo/types";

import {
  bookingSchema,
  checkRoomAvailabilityOutputSchema,
  type Booking,
  type CheckRoomAvailabilityInput,
  type CreateBookingSchema,
} from "../mastra/schemas/booking";
import { ROUTES } from "../constants/routes";
import { get, post } from "./common";
import { z } from "zod";

export type GetBookingsParams = {
  userId?: string;
  roomId?: string;
  status?: BookingStatus;
};

export const createBooking = async (
  booking: CreateBookingSchema,
): Promise<Booking> =>
  post(ROUTES.BOOKINGS, booking, bookingSchema, "Failed to create booking");

export const getBookings = async (
  params?: GetBookingsParams,
): Promise<Booking[]> =>
  get(ROUTES.BOOKINGS, z.array(bookingSchema), {
    searchParams: params,
    errorMessage: "Failed to fetch bookings",
  });

export const checkRoomAvailability = async (
  input: CheckRoomAvailabilityInput,
) =>
  get(ROUTES.BOOKING_AVAILABILITY, checkRoomAvailabilityOutputSchema, {
    searchParams: input,
    errorMessage: "Failed to check room availability",
  });
