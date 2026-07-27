import { z } from "zod";

export const checkRoomAvailabilityInputSchema = z.object({
  roomId: z.string().describe("Room ID to check"),
  checkInDate: z.string().describe("Check-in date (YYYY-MM-DD)"),
  checkOutDate: z.string().describe("Check-out date (YYYY-MM-DD)"),
  guests: z.number().describe("Guest count from the latest user message"),
  excludeBookingId: z
    .string()
    .optional()
    .describe(
      "When modifying a booking, exclude this booking ID from overlap detection",
    ),
});

export type CheckRoomAvailabilityInputArgs = z.infer<
  typeof checkRoomAvailabilityInputSchema
>;
