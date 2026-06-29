import { z } from "zod";

export const cancelBookingInputSchema = z.object({
  bookingId: z.string().describe("Booking ID to cancel"),
});

export const cancellationBookingSchema = z.object({
  bookingId: z.string(),
  roomName: z.string(),
  checkInDate: z.string(),
  checkOutDate: z.string(),
  guests: z.number(),
  totalPrice: z.number(),
});
