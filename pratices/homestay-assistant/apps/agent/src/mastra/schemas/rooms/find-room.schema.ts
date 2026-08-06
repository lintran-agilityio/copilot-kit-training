import { z } from "zod";

// Direct path — avoid `@/mastra/utils` barrel (it re-exports find-room.ts which
// imports this schema; that cycle makes Zod infer `name` as `{}`).
import { sanitizeFindRoomName } from "@/mastra/utils/sanitize-find-room-name";
import { roomSchema } from "./room.schema";

/**
 * Validation safety net: calendar/category words are stripped from `name`
 * before execute. Soft-book with only date/guests must not fail the tool call.
 */
const findRoomNameSchema = z
  .string()
  .optional()
  .describe(
    "Partial room NAME only (e.g. Moonlight, Heritage). Never pass weekdays, months, or calendar words (Mon, Monday, Aug, today, weekend) — those belong in date. Never pass category words like luxury, premium, top-floor, suite — those use level instead. Soft-book without a room title → omit name.",
  )
  .transform((value): string | undefined => sanitizeFindRoomName(value));

export const findRoomInputSchema = z.object({
  name: findRoomNameSchema,
  date: z
    .string()
    .optional()
    .describe("Check-in date to filter availability (YYYY-MM-DD)"),
  guests: z
    .number()
    .int()
    .positive()
    .optional()
    .describe(
      "Party size (guest count). Matches rooms with capacity >= guests — NOT exact capacity equality. Pass the party size as stated; never require capacity === guests.",
    ),
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
