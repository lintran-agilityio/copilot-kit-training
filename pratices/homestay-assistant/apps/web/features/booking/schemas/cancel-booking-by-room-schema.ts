import { z } from "zod";

import { confirmDeleteBookingSchema } from "./confirm-delete-booking-schema";

export const cancelBookingByRoomSchema = z.object({
  status: z
    .enum(["found", "ambiguous", "not_found"])
    .describe("Result from findBookingByRoom Mastra tool"),
  message: z.string().describe("Human-readable lookup message from Mastra"),
  booking: confirmDeleteBookingSchema
    .optional()
    .describe("Matched booking when status is found"),
  candidates: z
    .array(confirmDeleteBookingSchema)
    .optional()
    .describe("Matching bookings when status is ambiguous"),
});

export type CancelBookingByRoomArgs = z.infer<typeof cancelBookingByRoomSchema>;

export type CancelBookingByRoomResult =
  | {
      confirmed: false;
      reason?: "declined" | "not_found" | "ambiguous" | "error";
      message?: string;
    }
  | { confirmed: true; bookingId: string; roomName: string };
