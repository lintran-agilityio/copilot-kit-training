import { z } from "zod";
import type { CancellationBookingSummary } from "@repo/types";

export const cancelBookingInputSchema = z.object({
  bookingId: z.string().describe("Booking ID to cancel"),
});

export const cancellationBookingSchema = z.object({
  bookingId: z.string(),
  roomId: z.string(),
  roomName: z.string(),
  checkInDate: z.string(),
  checkOutDate: z.string(),
  guests: z.number(),
  totalPrice: z.number(),
}) satisfies z.ZodType<CancellationBookingSummary>;
