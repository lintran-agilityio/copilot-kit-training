import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import {
  findRoomInputSchema,
  findRoomOutputSchema,
  type FindRoomOutput,
} from "@/mastra/schemas/rooms";
import { findRooms } from "@/mastra/services";

/**
 * Slim payload for the model: keep ids for tool chaining, strip rich fields
 * so the LLM cannot dump descriptions/images that duplicate ListRoomPreview.
 */
const toFindRoomModelOutput = (output: FindRoomOutput) => {
  const matchCount = output.rooms.length;
  const replyHint =
    matchCount === 0
      ? "No rooms matched. Reply with ONE short sentence that nothing matched and suggest changing name/date/guests/level. Do NOT invent rooms."
      : `Room cards are already rendered in chat — do NOT write room names, a numbered list, or any room details in your reply. Reply with ONE very short sentence only (e.g. "I found ${matchCount} room(s) matching your request."). Never list room names in text.`;

  return {
    type: "json" as const,
    value: {
      matchCount,
      name: output.name,
      date: output.date,
      guests: output.guests,
      level: output.level,
      // IDs only — names are intentionally omitted so the model cannot list
      // them in chat text; the UI renders full room cards from the raw result.
      rooms: output.rooms.map((room) => ({ id: room.id })),
      replyHint,
    },
  };
};

export const findRoomTool = createTool({
  id: TOOL_KEYS.GET.FIND_ROOM,
  description:
    'REQUIRED for room search/filter and date availability. Call find_room when the guest searches by room name and/or filters by date, guests, or room level (any combination). Pass only the filters they gave. Do NOT use get_rooms for name/date/filter queries. Results render as room cards in chat automatically — do NOT write room names or a list in text. After calling: reply with ONE very short sentence only (e.g. "I found N room(s) matching your request."). NEVER list room names — ListRoomPreview already renders them. Never end the turn with tools only. For plain browse-all with no filters, prefer get_rooms instead.',
  inputSchema: findRoomInputSchema,
  outputSchema: findRoomOutputSchema,
  execute: async (inputData) => findRooms(inputData),
  toModelOutput: toFindRoomModelOutput,
});
