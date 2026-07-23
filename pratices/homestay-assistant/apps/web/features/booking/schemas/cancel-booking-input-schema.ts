import { z } from "zod";

export const cancelBookingInputSchema = z.object({
  bookingId: z.string().describe("Booking ID to cancel"),
});

export type CancelBookingInputArgs = z.infer<typeof cancelBookingInputSchema>;
