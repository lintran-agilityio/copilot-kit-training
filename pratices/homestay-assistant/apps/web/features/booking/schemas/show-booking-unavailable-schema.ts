import { z } from "zod";

export const bookingUnavailableReasonSchema = z.enum([
  "dates_unavailable",
  "capacity_exceeded",
]);

export type BookingUnavailableReason = z.infer<
  typeof bookingUnavailableReasonSchema
>;
