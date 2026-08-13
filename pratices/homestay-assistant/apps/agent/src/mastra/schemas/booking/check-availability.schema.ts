import { z } from "zod";
import {
  bookingAvailabilityFlowSchema,
  roomSchema,
} from "@repo/schemas";

export const checkRoomAvailabilityResponseSchema = z.object({
  available: z
    .boolean()
    .describe(
      "True only when dates are free AND guests fit room.capacity (when guests were sent)",
    ),
  guestsWithinCapacity: z
    .boolean()
    .describe(
      "False when guests exceed room.capacity. Compare guests to capacity, never to availableSlots.",
    ),
  room: roomSchema,
  checkInDate: z.string(),
  checkOutDate: z.string(),
  guests: z.number().optional(),
});

export const bookingAvailabilityNextActionSchema = z.enum([
  "confirm_booking",
  "CONFIRM_MODIFY_BOOKING",
  "stop_booking",
]);

export const checkRoomAvailabilityOutputSchema =
  checkRoomAvailabilityResponseSchema.extend({
    nextAction: bookingAvailabilityNextActionSchema.describe(
      "Mandatory step-machine transition: call the named confirm tool immediately, or stop when stop_booking is returned.",
    ),
    flow: bookingAvailabilityFlowSchema.describe(
      "Echo of the resolved flow — create never routes to CONFIRM_MODIFY_BOOKING; modify never routes to confirm_booking.",
    ),
    bookingId: z
      .string()
      .optional()
      .describe(
        "Set for flow=modify — the booking being updated (excludeBookingId). Pass to CONFIRM_MODIFY_BOOKING.",
      ),
    originalCheckInDate: z
      .string()
      .optional()
      .describe(
        "Pre-change check-in for flow=modify — pass to CONFIRM_MODIFY_BOOKING so the UI can show old → new.",
      ),
    originalCheckOutDate: z
      .string()
      .optional()
      .describe(
        "Pre-change check-out for flow=modify — pass to CONFIRM_MODIFY_BOOKING so the UI can show old → new.",
      ),
    originalGuests: z
      .number()
      .optional()
      .describe(
        "Pre-change guests for flow=modify — pass to CONFIRM_MODIFY_BOOKING so the UI can show old → new.",
      ),
    stayUnchanged: z
      .boolean()
      .optional()
      .describe(
        "True for flow=modify when the candidate stay equals the pre-change originals. nextAction is stop_booking — reply that nothing needs changing; never open CONFIRM_MODIFY_BOOKING or suggest other edits.",
      ),
  });

export type CheckRoomAvailabilityResponse = z.infer<
  typeof checkRoomAvailabilityResponseSchema
>;

export type CheckRoomAvailabilityOutput = z.infer<
  typeof checkRoomAvailabilityOutputSchema
>;
