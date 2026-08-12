import { z } from "zod";
import {
  findRoomInputSchema as findRoomInputBaseSchema,
  roomSchema,
} from "@repo/schemas";

import { normalizeFindRoomInput } from "@/mastra/utils/find-room";

/**
 * Mastra inputSchema — sanitize name/date together so a date cue stuffed into
 * `name` (e.g. "show available room at 16th") is recovered before fillers strip
 * the ordinal.
 */
export const findRoomInputSchema = findRoomInputBaseSchema.transform((input) =>
  normalizeFindRoomInput(input),
);

export type FindRoomInput = z.infer<typeof findRoomInputSchema>;

export const findRoomOutputSchema = z.object({
  rooms: z.array(roomSchema),
  name: z.string().optional(),
  date: z.string().optional(),
  guests: z.number().optional(),
  level: z.number().optional(),
  /** Echoed from input — FE uses this to skip Room List on book_resolve + 1 match. */
  purpose: findRoomInputBaseSchema.shape.purpose,
});

export type FindRoomOutput = z.infer<typeof findRoomOutputSchema>;
