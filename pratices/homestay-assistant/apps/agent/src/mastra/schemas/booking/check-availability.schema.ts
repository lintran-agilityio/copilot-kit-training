import { z } from "zod";

export const checkRoomAvailabilityInputSchema = z.object({
  roomId: z.string().describe("Room ID to check"),
  checkInDate: z.string().describe("Check-in date (YYYY-MM-DD)"),
  checkOutDate: z.string().describe("Check-out date (YYYY-MM-DD)"),
});

export const checkRoomAvailabilityOutputSchema = z.object({
  available: z.boolean(),
  roomId: z.string(),
  checkInDate: z.string(),
  checkOutDate: z.string(),
});

export type CheckRoomAvailabilityInput = z.infer<
  typeof checkRoomAvailabilityInputSchema
>;

export type CheckRoomAvailabilityOutput = z.infer<
  typeof checkRoomAvailabilityOutputSchema
>;
