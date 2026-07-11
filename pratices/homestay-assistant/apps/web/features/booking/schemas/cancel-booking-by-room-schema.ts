import { z } from "zod";

import { confirmDeleteBookingSchema } from "@/features/booking/schemas/confirm-delete-booking-schema";

export const cancelBookingByRoomSchema = z.object({
  bookings: z
    .array(confirmDeleteBookingSchema)
    .describe(
      "Matching bookings from findBookingByName — only call this tool when length > 0",
    ),
  queryName: z
    .string()
    .describe("Room name query from findBookingByName — pass as-is"),
});

export type CancelBookingByRoomArgs = z.infer<typeof cancelBookingByRoomSchema>;

export type CancelBookingByRoomResult =
  | {
      confirmed: false;
      reason?: "declined" | "not_found";
    }
  | { confirmed: true; bookingId: string; roomName: string };
