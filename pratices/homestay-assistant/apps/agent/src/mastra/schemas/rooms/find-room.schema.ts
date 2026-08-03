import { z } from "zod";

import { roomSchema } from "./room.schema";

export const findRoomInputSchema = z.object({
  name: z
    .string()
    .optional()
    .describe(
      "Partial room NAME only (e.g. Moonlight, Heritage). Never pass category words like luxury, premium, top-floor, suite — those use level instead.",
    ),
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
    .describe(
      "Room floor level. Use level: 4 for luxury / premium / top-floor / penthouse requests — do not put those words in name.",
    ),
});

export type FindRoomInput = z.infer<typeof findRoomInputSchema>;

export const findRoomOutputSchema = z.object({
  rooms: z.array(roomSchema),
  name: z.string().optional(),
  date: z.string().optional(),
  guests: z.number().optional(),
  level: z.number().optional(),
});

export type FindRoomOutput = z.infer<typeof findRoomOutputSchema>;
