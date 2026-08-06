import { z } from "zod";

/**
 * Base find_room args shared by Mastra validation and FE useRenderTool.
 * Agent may wrap `name` with a sanitize transform — do not add that here.
 */
export const findRoomInputSchema = z.object({
  name: z
    .string()
    .optional()
    .describe(
      "Partial room NAME only (e.g. Moonlight, Heritage). Never pass weekdays, months, or calendar words (Mon, Monday, Aug, today, weekend) — those belong in date. Never pass category words like luxury, premium, top-floor, suite — those use level instead. Soft-book without a room title → omit name.",
    ),
  date: z
    .string()
    .optional()
    .describe(
      "Check-in date as absolute YYYY-MM-DD only. Resolve today/tonight/tomorrow/weekend from CURRENT DATE before calling — never pass the words today, tomorrow, or weekend.",
    ),
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
