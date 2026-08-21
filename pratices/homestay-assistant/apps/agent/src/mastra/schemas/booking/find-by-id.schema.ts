import { z } from "zod";
import { roomSchema } from "@repo/schemas";
import { FIND_BOOKING_BY_ID_PURPOSE_VALUES } from "@repo/constants";

import { cancellationBookingSchema } from "./cancel.schema";

export const findBookingByIdInputSchema = z.object({
  bookingId: z
    .string()
    .describe(
      "Booking ID (UUID) to look up — extract the value after bookingId: in [booking-cancel] / [booking-modify] messages (format: [booking-cancel|booking-modify] bookingId: <uuid>. …) or chat cancel/modify messages. Never pass the room name or roomId.",
    ),
  purpose: z
    .enum(FIND_BOOKING_BY_ID_PURPOSE_VALUES)
    .optional()
    .describe(
      '"cancel" (or omit) allows any active booking, including one already checked in. "modify" additionally requires the stay not to have started yet — a booking whose check-in is today or past comes back as bookings: [] with reason: "not_modifiable" so the edit form is never opened for it.',
    ),
  requestedCheckInDate: z
    .string()
    .optional()
    .describe(
      "MODIFY only. The NEW check-in (YYYY-MM-DD) the guest explicitly stated in the LATEST message. Omit entirely if no new check-in was stated — never invent, infer, reuse an old value, or guess from context. When present (with requestedCheckOutDate and/or requestedGuests), the app skips the edit form and goes straight to availability with your stated value(s) merged over the booking's current stay.",
    ),
  requestedCheckOutDate: z
    .string()
    .optional()
    .describe(
      "MODIFY only. The NEW check-out (YYYY-MM-DD) the guest explicitly stated in the LATEST message (including a computed date from a stated night/day extend or shorten). Omit entirely if no new check-out was stated — never invent, infer, reuse an old value, or guess from context.",
    ),
  requestedGuests: z
    .number()
    .optional()
    .describe(
      "MODIFY only. The NEW guest count the guest explicitly stated in the LATEST message. Omit entirely if no new guest count was stated — never invent, infer, reuse an old value, or guess from context.",
    ),
});

export const findBookingByIdOutputSchema = z.object({
  bookings: z
    .array(cancellationBookingSchema)
    .describe(
      "Active booking summary when found (length 1), including bookingId + roomId + current dates/guests. If length 0, reply in chat only — do not open cancel/modify dialogs.",
    ),
  bookingId: z.string().describe("Booking ID that was looked up"),
  queryName: z
    .string()
    .describe(
      "Room display name from the booking — pass as queryName to show_cancel_dialog_confirm when cancelling",
    ),
  room: roomSchema
    .optional()
    .describe(
      "Full room object when booking is found — pass to edit_modify_booking for the modify form. Do not call get_room_by_id in a modify turn.",
    ),
  reason: z
    .enum(["not_modifiable"])
    .optional()
    .describe(
      'Only set when bookings is empty AND purpose was "modify" AND the booking exists/is active but its check-in is today or past. Reply that the stay has already started and can no longer be modified, and offer to cancel instead — do not treat this as a generic not-found.',
    ),
  requestedCheckInDate: z
    .string()
    .optional()
    .describe(
      "Echoed back from this call's own requestedCheckInDate, or carried over from an earlier show_modify_dialog_select pick when this call omitted it — the app's routing decision (edit form vs straight to availability) is based on this resolved value, not on what you passed to this specific call.",
    ),
  requestedCheckOutDate: z
    .string()
    .optional()
    .describe(
      "Echoed back from this call's own requestedCheckOutDate, or carried over from an earlier show_modify_dialog_select pick when this call omitted it.",
    ),
  requestedGuests: z
    .number()
    .optional()
    .describe(
      "Echoed back from this call's own requestedGuests, or carried over from an earlier show_modify_dialog_select pick when this call omitted it.",
    ),
});

export type FindBookingByIdInput = z.infer<typeof findBookingByIdInputSchema>;
export type FindBookingByIdOutput = z.infer<typeof findBookingByIdOutputSchema>;
