import { z } from "zod";

import { confirmDeleteBookingSchema } from "@/features/booking/schemas/confirm-delete-booking-schema";

export const cancelBookingByRoomSchema = z.object({
  bookings: z
    .array(confirmDeleteBookingSchema)
    .describe("Matching bookings from findBookingByRoom — pass as-is"),
  queryName: z
    .string()
    .describe("Room name query from findBookingByRoom"),
});

export type CancelBookingByRoomArgs = z.infer<typeof cancelBookingByRoomSchema>;

export type CancelBookingByRoomResult =
  | {
      confirmed: false;
      reason?: "declined" | "not_found";
    }
  | { confirmed: true; bookingId: string; roomName: string };
