import { z } from "zod";
import { findRoomInputSchema as findRoomInputBaseSchema, roomSchema } from "@repo/schemas";

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
