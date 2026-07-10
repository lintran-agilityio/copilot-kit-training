import { z } from "zod";

import { roomSchema } from "@/mastra/schemas/rooms/room.schema";

export const checkRoomAvailabilityInputSchema = z.object({
  roomId: z.string().describe("Room ID to check"),
  checkInDate: z.string().describe("Check-in date (YYYY-MM-DD)"),
  checkOutDate: z.string().describe("Check-out date (YYYY-MM-DD)"),
  guests: z
    .number()
    .int()
    .positive()
    .describe(
      "Guest count from the LATEST user message. Validated against room.capacity (not availableSlots).",
    ),
});

export const checkRoomAvailabilityOutputSchema = z.object({
  available: z
    .boolean()
    .describe(
      "True only when dates are free AND guests fit room.capacity (when guests were sent)",
    ),
  guestsWithinCapacity: z
    .boolean()
    .describe(
      "False when guests exceed room.capacity. Compare guests to capacity, never to availableSlots.",
    ),
  room: roomSchema,
  checkInDate: z.string(),
  checkOutDate: z.string(),
  guests: z.number().optional(),
});

export type CheckRoomAvailabilityInput = z.infer<
  typeof checkRoomAvailabilityInputSchema
>;

export type CheckRoomAvailabilityOutput = z.infer<
  typeof checkRoomAvailabilityOutputSchema
>;
