import { z } from "zod";

export const checkRoomAvailabilityInputSchema = z
  .object({
    roomId: z.string().describe("Room ID to check"),
    checkInDate: z.string().describe("Check-in date (YYYY-MM-DD)"),
    checkOutDate: z.string().describe("Check-out date (YYYY-MM-DD)"),
    guests: z.number().describe("Guest count from the latest user message"),
    flow: z
      .enum(["create", "modify"])
      .optional()
      .describe(
        "create = new booking (omit excludeBookingId). modify = after edit_modify_booking confirmed (require excludeBookingId). If omitted: inferred from excludeBookingId.",
      ),
    excludeBookingId: z
      .string()
      .optional()
      .describe(
        "Required when flow=modify: booking ID excluded from overlap detection",
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

export type CheckRoomAvailabilityInputArgs = z.infer<
  typeof checkRoomAvailabilityInputSchema
>;
