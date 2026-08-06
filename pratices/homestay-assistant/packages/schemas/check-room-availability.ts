import { z } from "zod";

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
        "create = new booking (omit excludeBookingId). modify = after edit_modify_booking confirmed:true, OR when the guest already stated the new dates/guests and the edit form was skipped (require excludeBookingId=bookingId). If omitted: inferred as modify when excludeBookingId is set, otherwise create.",
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

export type CheckRoomAvailabilityInput = z.infer<
  typeof checkRoomAvailabilityInputSchema
>;
