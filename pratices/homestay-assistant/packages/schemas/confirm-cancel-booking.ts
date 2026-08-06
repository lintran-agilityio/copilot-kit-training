import type { CancellationBookingSummary } from "@repo/types";
import { z } from "zod";

/**
 * Booking summary for cancel HITL — shared by Mastra cancellation schema and
 * FE confirm_cancel / show_cancel_dialog_confirm params.
 */
export const confirmCancelBookingSchema = z.object({
  bookingId: z.string().describe("Booking ID to cancel"),
  roomId: z.string().describe("Room ID associated with the booking"),
  roomName: z.string().describe("Room display name"),
  checkInDate: z.string().describe("Check-in date (YYYY-MM-DD)"),
  checkOutDate: z.string().describe("Check-out date (YYYY-MM-DD)"),
  guests: z.number().describe("Number of guests"),
  totalPrice: z.number().describe("Total price in VND"),
}) satisfies z.ZodType<CancellationBookingSummary>;

export type ConfirmCancelBookingArgs = z.infer<
  typeof confirmCancelBookingSchema
>;

export type ConfirmCancelBookingResult =
  | { confirmed: false }
  | { confirmed: true; bookingId: string };

/** Alias used by Mastra cancel tool schemas. */
export const cancellationBookingSchema = confirmCancelBookingSchema;

/** HITL show_cancel_dialog_confirm params. */
export const cancelBookingByRoomSchema = z.object({
  bookings: z
    .array(confirmCancelBookingSchema)
    .describe(
      "Matching bookings from find_booking_by_id — only call this tool when length > 0",
    ),
  queryName: z
    .string()
    .describe("Room display name from find_booking_by_id — pass as-is"),
});

export type CancelBookingByRoomArgs = z.infer<typeof cancelBookingByRoomSchema>;

export type CancelBookingByRoomResult =
  | {
      confirmed: false;
      reason?: "declined" | "not_found";
    }
  | { confirmed: true; bookingId: string; roomName: string };
