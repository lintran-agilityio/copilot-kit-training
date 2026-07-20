import { z } from "zod";

import { roomSchema } from "@/mastra/schemas/rooms/room.schema";

export const checkRoomAvailabilityInputSchema = z.object({
  roomId: z.string().describe("Room ID to check"),
  checkInDate: z
    .string()
    .describe(
      "Check-in date as absolute YYYY-MM-DD. Resolve relative phrases (today/tomorrow) from CURRENT DATE in instructions — never invent a year.",
    ),
  checkOutDate: z
    .string()
    .describe(
      "Check-out date as absolute YYYY-MM-DD. Must be after checkInDate. Resolve relative phrases from CURRENT DATE.",
    ),
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
