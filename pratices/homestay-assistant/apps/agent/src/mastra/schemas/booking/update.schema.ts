import { z } from "zod";

export const updateBookingSchema = z.object({
  bookingId: z
    .string()
    .describe(
      "Booking ID to update — from confirm_modify_booking result. Never pass a roomId.",
    ),
  checkInDate: z
    .string()
    .describe("Updated check-in date as absolute YYYY-MM-DD"),
  checkOutDate: z
    .string()
    .describe("Updated check-out date as absolute YYYY-MM-DD"),
  guests: z
    .number()
    .int()
    .positive()
    .describe("Updated guest count"),
});

export type UpdateBookingSchema = z.infer<typeof updateBookingSchema>;
