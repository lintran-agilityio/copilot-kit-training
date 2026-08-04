import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import {
  findRoomInputSchema,
  findRoomOutputSchema,
} from "@/mastra/schemas/rooms";
import { findRooms } from "@/mastra/services";
import {
  normalizeFindRoomInput,
  toFindRoomModelOutput,
} from "@/mastra/utils";

export const findRoomTool = createTool({
  id: TOOL_KEYS.GET.FIND_ROOM,
  description:
    'REQUIRED for room search/filter and date availability (including "show available rooms" / "what\'s available"). Call find_room when the guest searches by room name and/or filters by date, guests, or room level, or asks for available rooms. If they say available/what\'s available without a date, pass date = CURRENT DATE today (YYYY-MM-DD). Luxury / premium / top-floor / penthouse → pass level: 4 ONLY (never those words as name — name is literal room-name search). Do NOT use get_rooms for availability or name/date/filter queries. Results render as room cards in chat automatically — do NOT write room names or a list in text. After calling: pass result.rooms[].id to update_room_list, then reply with ONE very short sentence only (e.g. "I found N room(s) matching your request."). NEVER list room names — ListRoomPreview already renders them. Never end the turn with tools only. For plain "show all rooms" catalog browse with no availability wording, prefer get_rooms instead.',
  inputSchema: findRoomInputSchema,
  outputSchema: findRoomOutputSchema,
  execute: async (inputData) => findRooms(normalizeFindRoomInput(inputData)),
  toModelOutput: toFindRoomModelOutput,
});
