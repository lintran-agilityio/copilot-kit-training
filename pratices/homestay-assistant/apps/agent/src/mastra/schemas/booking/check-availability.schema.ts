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
  "confirm_modify_booking",
  "stop_booking",
]);

export const checkRoomAvailabilityOutputSchema =
  checkRoomAvailabilityResponseSchema.extend({
    nextAction: bookingAvailabilityNextActionSchema.describe(
      "Mandatory step-machine transition: call the named confirm tool immediately, or stop when stop_booking is returned.",
    ),
    flow: bookingAvailabilityFlowSchema.describe(
      "Echo of the resolved flow — create never routes to confirm_modify_booking; modify never routes to confirm_booking.",
    ),
  });

export type CheckRoomAvailabilityResponse = z.infer<
  typeof checkRoomAvailabilityResponseSchema
>;

export type CheckRoomAvailabilityOutput = z.infer<
  typeof checkRoomAvailabilityOutputSchema
>;
