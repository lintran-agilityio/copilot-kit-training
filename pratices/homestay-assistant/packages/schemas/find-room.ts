import { z } from "zod";
import { FIND_ROOM_PURPOSE_VALUES } from "@repo/constants";

/**
 * Why find_room was called — drives chat UI (Room List vs suppress) and replyHint.
 * Default / omit = search (always show Room List when matches exist).
 */
export const findRoomPurposeSchema = z
  .enum(FIND_ROOM_PURPOSE_VALUES)
  .optional()
  .describe(
    'search = FIND/filter ("find/show Misty Pavilion") — Room List always. recommend = soft-book without a named room — Room List. book_resolve = BOOK name lookup ("I want to book Misty Pavilion for 1 guest this weekend") — pass name to match the room, PLUS date/guests when the latest message states them (never used to filter the name match — only echoed back so the platform can deterministically decide the next booking step: skip the Booking Form when both are already known, open it otherwise); skip Room List when exactly 1 match, show list when >1, and continue the booking flow with the matched room id. resolve = internal room-name → roomId lookup for cancel/modify without a bookingId (e.g. "modify guest number for Moonlight Loft") — pass name only; Room List always suppressed regardless of match count; use the single match\'s id as get_bookings.roomId, or ask which room when there is more than one match. Never use book_resolve or resolve for find/show/tell-me-about.',
  );

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
  purpose: findRoomPurposeSchema,
});

export type FindRoomInput = z.infer<typeof findRoomInputSchema>;
export type FindRoomPurpose = NonNullable<FindRoomInput["purpose"]>;
