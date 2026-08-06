import { z } from "zod";
import {
  findRoomInputSchema as findRoomInputBaseSchema,
  roomSchema,
} from "@repo/schemas";

// Direct paths — avoid `@/mastra/utils` barrel (cycle with find-room.ts).
import { sanitizeFindRoomDate, sanitizeFindRoomName } from "@/mastra/utils";

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

/**
 * Relative words (today/weekend) → absolute YYYY-MM-DD. API rejects non-YMD.
 */
const findRoomDateSchema = z
  .string()
  .optional()
  .describe(
    "Check-in date as absolute YYYY-MM-DD only. Resolve today/tonight/tomorrow/weekend from CURRENT DATE before calling — never pass those words.",
  )
  .transform((value): string | undefined => sanitizeFindRoomDate(value));

/** Mastra inputSchema — shared base + name/date sanitize transforms. */
export const findRoomInputSchema = findRoomInputBaseSchema
  .omit({ name: true, date: true })
  .extend({ name: findRoomNameSchema, date: findRoomDateSchema });

export type FindRoomInput = z.infer<typeof findRoomInputSchema>;

export const findRoomOutputSchema = z.object({
  rooms: z.array(roomSchema),
  name: z.string().optional(),
  date: z.string().optional(),
  guests: z.number().optional(),
  level: z.number().optional(),
});

export type FindRoomOutput = z.infer<typeof findRoomOutputSchema>;
