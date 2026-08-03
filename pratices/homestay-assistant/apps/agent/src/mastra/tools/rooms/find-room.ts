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
    'REQUIRED for room search/filter and date availability. Call find_room when the guest searches by room name and/or filters by date, guests, or room level (any combination). Luxury / premium / top-floor / penthouse → pass level: 4 ONLY (never those words as name — name is literal room-name search). Pass only the filters they gave. Do NOT use get_rooms for name/date/filter queries. Results render as room cards in chat automatically — do NOT write room names or a list in text. After calling: reply with ONE very short sentence only (e.g. "I found N room(s) matching your request."). NEVER list room names — ListRoomPreview already renders them. Never end the turn with tools only. For plain browse-all with no filters, prefer get_rooms instead.',
  inputSchema: findRoomInputSchema,
  outputSchema: findRoomOutputSchema,
  execute: async (inputData) => findRooms(normalizeFindRoomInput(inputData)),
  toModelOutput: toFindRoomModelOutput,
});
