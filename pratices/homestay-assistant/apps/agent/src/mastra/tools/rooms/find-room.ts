import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import {
  findRoomInputSchema,
  findRoomOutputSchema,
} from "@/mastra/schemas/rooms";
import { findRooms } from "@/mastra/services";
import { toFindRoomModelOutput } from "@/mastra/utils";
import {
  serviceContextFromTool,
  throwIfAborted,
} from "@/mastra/utils/abort";

export const findRoomTool = createTool({
  id: TOOL_KEYS.GET.FIND_ROOM,
  description:
    'REQUIRED for room search/filter and date availability (including "show available rooms" / "what\'s available"). Call find_room when the guest searches by room name and/or filters by date, guests, or room level, or asks for available rooms. Pass purpose: "search" (or omit) for find/show, "recommend" for soft-book without a named room, "book_resolve" ONLY when BOOK resolves a specific room name (Room List suppressed on exactly 1 match). Soft-book without a room title → omit name; weekdays/months (Mon, Monday, Aug, …) are date parts — never name. guests = party size: rooms with capacity >= guests match (a capacity-4 room is valid for 3 guests) — NEVER treat guests as exact capacity equality. If they say available/what\'s available without a date, pass date = CURRENT DATE today (YYYY-MM-DD). Luxury / premium / top-floor / penthouse → pass level: 4 ONLY (never those words as name — name is literal room-name search). Do NOT use get_rooms for availability or name/date/filter queries. For search/recommend, results render as room cards in chat automatically — the cards ARE the response; do NOT write room names or a list in text, and do NOT add an acknowledgement/summary sentence either — tools-only is allowed when matches are found. Follow replyHint after calling. Do NOT call update_room_list after find_room — it can duplicate the chat list. NEVER call find_room again in the same turn to "show" or re-present those results. When nothing matched, still send one short chat sentence saying so. For plain "show all rooms" catalog browse with no availability wording, prefer get_rooms instead.',
  inputSchema: findRoomInputSchema,
  outputSchema: findRoomOutputSchema,
  execute: async (inputData, context) => {
    throwIfAborted(context.abortSignal);
    // inputSchema already runs normalizeFindRoomInput
    return findRooms(inputData, serviceContextFromTool(context));
  },
  toModelOutput: toFindRoomModelOutput,
});
