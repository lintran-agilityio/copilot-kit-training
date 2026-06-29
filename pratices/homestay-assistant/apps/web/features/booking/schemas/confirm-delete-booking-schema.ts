import { z } from "zod";

export const confirmDeleteBookingSchema = z.object({
  bookingId: z.string().describe("Booking ID to cancel"),
  roomName: z.string().describe("Room display name"),
  checkInDate: z.string().describe("Check-in date (YYYY-MM-DD)"),
  checkOutDate: z.string().describe("Check-out date (YYYY-MM-DD)"),
  guests: z.number().optional().describe("Number of guests"),
  totalPrice: z.number().optional().describe("Total price in VND"),
});

export type ConfirmDeleteBookingArgs = z.infer<typeof confirmDeleteBookingSchema>;

export type ConfirmDeleteBookingResult =
  | { confirmed: false }
  | { confirmed: true; bookingId: string };
