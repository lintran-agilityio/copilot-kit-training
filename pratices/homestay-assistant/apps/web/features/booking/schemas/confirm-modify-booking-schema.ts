import { z } from "zod";

import { roomObjectSchema } from "@/features/room/schemas/room-schemas";

export const confirmModifyBookingSchema = z.object({
  bookingId: z
    .string()
    .describe("Booking ID being modified — never a roomId"),
  room: roomObjectSchema.describe(
    "Full room object from check_room_availability.result.room",
  ),
  checkInDate: z
    .string()
    .describe(
      "Updated check-in (YYYY-MM-DD) from check_room_availability.result — same as edit_modify_booking confirmed:true, not the original booking",
    ),
  checkOutDate: z
    .string()
    .describe(
      "Updated check-out (YYYY-MM-DD) from check_room_availability.result — same as edit_modify_booking confirmed:true, not the original booking",
    ),
  guests: z
    .number()
    .describe(
      "Updated guests from check_room_availability.result — same as edit_modify_booking confirmed:true",
    ),
  originalCheckInDate: z
    .string()
    .optional()
    .describe(
      "Pre-edit check-in from edit_modify_booking tool-call args (current booking) — for UI before→after diffs only",
    ),
  originalCheckOutDate: z
    .string()
    .optional()
    .describe(
      "Pre-edit check-out from edit_modify_booking tool-call args (current booking) — for UI before→after diffs only",
    ),
  originalGuests: z
    .number()
    .optional()
    .describe(
      "Pre-edit guests from edit_modify_booking tool-call args (current booking) — for UI before→after diffs only",
    ),
});

export type ConfirmModifyBookingArgs = z.infer<
  typeof confirmModifyBookingSchema
>;

export type ConfirmModifyBookingResult =
  | { confirmed: false }
  | {
      confirmed: true;
      bookingId: string;
      checkInDate: string;
      checkOutDate: string;
      guests: number;
    };
