import { z } from "zod";

import { roomObjectSchema } from "@/features/room/schemas/room-schemas";

export const confirmModifyBookingSchema = z.object({
  bookingId: z
    .string()
    .describe("Booking ID being modified — never a roomId"),
  room: roomObjectSchema.describe(
    "Full room object from check_room_availability.result.room",
  ),
  checkInDate: z.string().describe("Updated check-in date (YYYY-MM-DD)"),
  checkOutDate: z.string().describe("Updated check-out date (YYYY-MM-DD)"),
  guests: z.number().describe("Updated number of guests"),
});

export type ConfirmModifyBookingArgs = z.infer<
  typeof confirmModifyBookingSchema
>;

export type ConfirmModifyBookingResult =
  | { confirmed: false }
  | {
      confirmed: true;
      bookingId: string;
      checkInDate: string;
      checkOutDate: string;
      guests: number;
    };
