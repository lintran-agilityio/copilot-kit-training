import { z } from "zod";

import { cancellationBookingSchema } from "./cancel.schema";

export const findBookingByIdInputSchema = z.object({
  bookingId: z
    .string()
    .describe(
      "Booking ID (UUID) to look up — extract the value after bookingId: in [booking-cancel] messages (format: [booking-cancel] bookingId: <uuid>. …) or chat cancel messages. Never pass the room name.",
    ),
});

export const findBookingByIdOutputSchema = z.object({
  bookings: z
    .array(cancellationBookingSchema)
    .describe(
      "Active booking summary when found (length 1). If length 0, reply in chat only — do not open the cancel dialog.",
    ),
  bookingId: z.string().describe("Booking ID that was looked up"),
  queryName: z
    .string()
    .describe("Room display name from the booking — pass as queryName to show_cancel_dialog_confirm"),
});

export type FindBookingByIdInput = z.infer<typeof findBookingByIdInputSchema>;
export type FindBookingByIdOutput = z.infer<typeof findBookingByIdOutputSchema>;
