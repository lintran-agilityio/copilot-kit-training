import { z } from "zod";

import { bookingSchema } from "./booking.schema";

export const getBookingsOutputSchema = z.object({
  bookings: z.array(bookingSchema),
  /**
   * Internal routing for toModelOutput replyHint — set when cancel/modify-without-id
   * prepareStep forced this fetch. Not for guests.
   */
  intentHint: z.enum(["cancel_disambiguate", "modify_disambiguate"]).optional(),
});

export type GetBookingsOutput = z.infer<typeof getBookingsOutputSchema>;
