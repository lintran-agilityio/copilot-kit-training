import { z } from "zod";

import { roomObjectSchema } from "@/features/room/schemas/room-schemas";

export const confirmBookingSchema = z.object({
  room: roomObjectSchema.describe(
    "Full room object from checkRoomAvailability.result.room",
  ),
  checkInDate: z.string().describe("Check-in date (YYYY-MM-DD)"),
  checkOutDate: z.string().describe("Check-out date (YYYY-MM-DD)"),
  guests: z.number().describe("Number of guests"),
});

export type ConfirmBookingArgs = z.infer<typeof confirmBookingSchema>;

export type ConfirmBookingResult =
  | { confirmed: false }
  | {
      confirmed: true;
      roomId: string;
      checkInDate: string;
      checkOutDate: string;
      guests: number;
    };
