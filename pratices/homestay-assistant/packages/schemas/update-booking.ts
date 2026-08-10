import { z } from "zod";

export const updateBookingInputSchema = z.object({
  bookingId: z
    .string()
    .describe(
      "Booking ID to update — from CONFIRM_MODIFY_BOOKING result. Never pass a roomId.",
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

export type UpdateBookingInput = z.infer<typeof updateBookingInputSchema>;
