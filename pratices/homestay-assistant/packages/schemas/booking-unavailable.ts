import { z } from "zod";

/** Reason codes for booking-unavailable generative UI / HITL. */
export const bookingUnavailableReasonSchema = z.enum([
  "dates_unavailable",
  "capacity_exceeded",
]);

export type BookingUnavailableReason = z.infer<
  typeof bookingUnavailableReasonSchema
>;
