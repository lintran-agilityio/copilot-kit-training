import type { CancellationBookingSummary } from "@repo/types";
import { z } from "zod";

export const confirmCancelBookingSchema = z.object({
  bookingId: z.string().describe("Booking ID to cancel"),
  roomId: z.string().describe("Room ID associated with the booking"),
  roomName: z.string().describe("Room display name"),
  checkInDate: z.string().describe("Check-in date (YYYY-MM-DD)"),
  checkOutDate: z.string().describe("Check-out date (YYYY-MM-DD)"),
  guests: z.number().describe("Number of guests"),
  totalPrice: z.number().describe("Total price in VND"),
}) satisfies z.ZodType<CancellationBookingSummary>;

export type ConfirmCancelBookingArgs = z.infer<typeof confirmCancelBookingSchema>;

export type ConfirmCancelBookingResult =
  | { confirmed: false }
  | { confirmed: true; bookingId: string };
