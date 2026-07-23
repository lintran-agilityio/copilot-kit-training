import { z } from "zod";

import { roomSchema } from "@/mastra/schemas/rooms/room.schema";
import { cancellationBookingSchema } from "./cancel.schema";

export const findBookingByIdInputSchema = z.object({
  bookingId: z
    .string()
    .describe(
      "Booking ID (UUID) to look up — extract the value after bookingId: in [booking-cancel] / [booking-modify] messages (format: [booking-cancel|booking-modify] bookingId: <uuid>. …) or chat cancel/modify messages. Never pass the room name or roomId.",
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
});

export type FindBookingByIdInput = z.infer<typeof findBookingByIdInputSchema>;
export type FindBookingByIdOutput = z.infer<typeof findBookingByIdOutputSchema>;
