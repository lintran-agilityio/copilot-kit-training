import { z } from "zod";

export const findRoomInputSchema = z.object({
  name: z
    .string()
    .optional()
    .describe("Partial room name to search (case-insensitive)"),
  date: z
    .string()
    .optional()
    .describe("Check-in date to filter availability (YYYY-MM-DD)"),
  guests: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Minimum guest capacity the room must support"),
  level: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe("Room floor level to filter by"),
});

export type FindRoomInputArgs = z.infer<typeof findRoomInputSchema>;
