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
      : 'Room cards already rendered in chat. Reply with ONE short confirmation of the search filters only (e.g. "Here are the available rooms matching your request …"). Do NOT list prices, descriptions, amenities, images, or markdown room details.';

  return {
    type: "json" as const,
    value: {
      matchCount,
      name: output.name,
      date: output.date,
      guests: output.guests,
      level: output.level,
      rooms: output.rooms.map((room) => ({ id: room.id, name: room.name })),
      replyHint,
    },
  };
};

export const findRoomTool = createTool({
  id: TOOL_KEYS.GET.FIND_ROOM,
  description:
    'REQUIRED for room search/filter and date availability. Call find_room when the guest searches by room name and/or filters by date, guests, or room level (any combination). Pass only the filters they gave. Do NOT use getRooms for name/date/filter queries. Results render as room cards in chat automatically — do NOT dump the full list in text. After calling: reply with ONE short confirmation of the search filters only (e.g. "Here are the available rooms matching your request …"). Do NOT restate any room fields (names, prices, descriptions, amenities, images) — ListRoomPreview already renders them. Never end the turn with tools only. For plain browse-all with no filters, prefer getRooms instead.',
  inputSchema: findRoomInputSchema,
  outputSchema: findRoomOutputSchema,
  execute: async (inputData) => findRooms(inputData),
  toModelOutput: toFindRoomModelOutput,
});
