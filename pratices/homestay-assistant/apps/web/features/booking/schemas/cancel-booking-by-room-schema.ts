import { z } from "zod";

import { confirmCancelBookingSchema } from "@/features/booking/schemas/confirm-cancel-booking-schema";

export const cancelBookingByRoomSchema = z.object({
  bookings: z
    .array(confirmCancelBookingSchema)
    .describe(
      "Matching bookings from find_booking_by_id — only call this tool when length > 0",
    ),
  queryName: z
    .string()
    .describe("Room display name from find_booking_by_id — pass as-is"),
});

export type CancelBookingByRoomArgs = z.infer<typeof cancelBookingByRoomSchema>;

export type CancelBookingByRoomResult =
  | {
      confirmed: false;
      reason?: "declined" | "not_found";
    }
  | { confirmed: true; bookingId: string; roomName: string };
