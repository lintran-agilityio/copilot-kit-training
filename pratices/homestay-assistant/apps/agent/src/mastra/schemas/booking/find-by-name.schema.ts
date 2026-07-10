import { z } from "zod";

import { cancellationBookingSchema } from "./cancel.schema";

export const findBookingByNameInputSchema = z.object({
  roomName: z
    .string()
    .describe(
      "Room display name from the guest message, e.g. The Meridian or Orchid Twin Loft. Prefer the catalog name; filler words (cancel, booking, room) are OK.",
    ),
});

export const findBookingByNameOutputSchema = z.object({
  bookings: z
    .array(cancellationBookingSchema)
    .describe(
      "Matching active bookings. If length > 0 pass as-is to show_cancel_dialog_confirm; if 0 reply in chat only (do not open the cancel dialog).",
    ),
  queryName: z
    .string()
    .describe("Normalized room-name query used for the lookup"),
});

export type FindBookingByNameInput = z.infer<
  typeof findBookingByNameInputSchema
>;
export type FindBookingByNameOutput = z.infer<
  typeof findBookingByNameOutputSchema
>;
