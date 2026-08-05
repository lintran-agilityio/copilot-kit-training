import { z } from "zod";

import { roomSchema } from "@/mastra/schemas/rooms/room.schema";

export const bookingAvailabilityFlowSchema = z.enum(["create", "modify"]);

export const checkRoomAvailabilityInputSchema = z
  .object({
    roomId: z.string().describe("Room ID to check"),
    checkInDate: z
      .string()
      .describe(
        "Check-in date as absolute YYYY-MM-DD. Resolve relative phrases (today/tomorrow) from CURRENT DATE in instructions — never invent a year.",
      ),
    checkOutDate: z
      .string()
      .describe(
        "Check-out date as absolute YYYY-MM-DD. Must be after checkInDate. Resolve relative phrases from CURRENT DATE.",
      ),
    guests: z
      .number()
      .int()
      .positive()
      .describe(
        "Guest count from the LATEST user message. Validated against room.capacity (not availableSlots).",
      ),
    flow: bookingAvailabilityFlowSchema
      .optional()
      .describe(
        "create = new booking (omit excludeBookingId). modify = after edit_modify_booking confirmed:true (require excludeBookingId=bookingId). If omitted: inferred as modify when excludeBookingId is set, otherwise create.",
      ),
    excludeBookingId: z
      .string()
      .optional()
      .describe(
        "Required when flow=modify: the booking id being updated so it is excluded from overlap detection.",
      ),
  })
  .transform((value) => {
    const flow =
      value.flow ??
      (value.excludeBookingId?.trim() ? "modify" : "create");

    return {
      ...value,
      flow,
    };
  })
  .superRefine((value, ctx) => {
    if (value.flow !== "modify") {
      return;
    }

    if (!value.excludeBookingId?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "excludeBookingId is required when flow is modify",
        path: ["excludeBookingId"],
      });
    }
  });

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

export type CheckRoomAvailabilityInput = z.infer<
  typeof checkRoomAvailabilityInputSchema
>;

export type CheckRoomAvailabilityOutput = z.infer<
  typeof checkRoomAvailabilityOutputSchema
>;
