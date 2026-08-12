import { z } from "zod";

import { confirmCancelBookingSchema } from "./confirm-cancel-booking.js";

/**
 * Booking row for modify multi-match HITL — same shape as cancel picker rows
 * so get_bookings can map id → bookingId + totalPrice without inventing fields.
 */
export const modifyBookingPickerItemSchema = confirmCancelBookingSchema;

export type ModifyBookingPickerItem = z.infer<
  typeof modifyBookingPickerItemSchema
>;

/**
 * HITL show_modify_dialog_select params.
 *
 * Prefer `bookingIds` (small JSON — avoids truncated tool-arg streams).
 * The FE hydrates rows from the latest get_bookings result in the turn.
 * `bookings` remains supported when the model still sends full rows.
 */
export const modifyBookingByRoomSchema = z.object({
  bookingIds: z
    .array(z.string())
    .optional()
    .describe(
      "Preferred: ALL matching get_bookings ids only (no other fields). FE hydrates display rows from that get_bookings result. Prefer this over bookings[] to keep tool args small.",
    ),
  bookings: z
    .array(modifyBookingPickerItemSchema)
    .optional()
    .describe(
      "Optional full rows when bookingIds is omitted — map get_bookings.id → bookingId and include totalPrice. Prefer bookingIds instead.",
    ),
  queryName: z
    .string()
    .describe(
      "Room display name, date cue, or \"your bookings\" when disambiguating multiple get_bookings matches for modify",
    ),
});

export type ModifyBookingByRoomArgs = z.infer<typeof modifyBookingByRoomSchema>;

export type ModifyBookingByRoomResult =
  | {
      confirmed: false;
      reason?: "declined" | "not_found";
    }
  | { confirmed: true; bookingId: string; roomName: string };
