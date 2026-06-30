import type { CancellationBookingSummary } from "@repo/types";
import { z } from "zod";

export const confirmDeleteBookingSchema = z.object({
  bookingId: z.string().describe("Booking ID to cancel"),
  roomName: z.string().describe("Room display name"),
  checkInDate: z.string().describe("Check-in date (YYYY-MM-DD)"),
  checkOutDate: z.string().describe("Check-out date (YYYY-MM-DD)"),
  guests: z.number().describe("Number of guests"),
  totalPrice: z.number().describe("Total price in VND"),
}) satisfies z.ZodType<CancellationBookingSummary>;

export type ConfirmDeleteBookingArgs = z.infer<typeof confirmDeleteBookingSchema>;

export type ConfirmDeleteBookingResult =
  | { confirmed: false }
  | { confirmed: true; bookingId: string };
