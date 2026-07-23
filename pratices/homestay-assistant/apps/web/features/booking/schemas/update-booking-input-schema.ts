import { z } from "zod";

export const updateBookingInputSchema = z.object({
  bookingId: z.string().describe("Booking ID to update"),
  checkInDate: z.string().describe("Check-in date (YYYY-MM-DD)"),
  checkOutDate: z.string().describe("Check-out date (YYYY-MM-DD)"),
  guests: z.number().describe("Number of guests"),
});

export type UpdateBookingInputArgs = z.infer<typeof updateBookingInputSchema>;
