import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import { getRooms } from "@/mastra/services";
import {
  getRoomsInputSchema,
  getRoomsOutputSchema,
  type GetRoomsOutput,
} from "@/mastra/schemas/rooms";

/**
 * Slim payload for the model: ids only, mirroring find_room. Re-emitting full
 * room objects as update_room_list arguments overflows the per-step output
 * token budget, which truncates the tool call and breaks the AG-UI stream.
 * The UI still receives the raw result with every field.
 */
const toGetRoomsModelOutput = (output: GetRoomsOutput) => {
  const roomCount = output.rooms.length;
  const replyHint =
    roomCount === 0
      ? "No rooms available. Reply with ONE short sentence saying so — do NOT invent rooms."
      : "Pass roomIds to update_room_list, then reply with ONE short sentence that the rooms are ready on the grid. Never write room names, prices, or details in chat.";

  return {
    type: "json" as const,
    value: {
      roomCount,
      // IDs only — the model never needs the rich fields, and withholding them
      // stops it from dumping room details into chat.
      roomIds: output.rooms.map((room) => room.id),
      replyHint,
    },
  };
};

export const getRoomsTool = createTool({
  id: TOOL_KEYS.GET.ROOMS,
  description:
    "Fetch all rooms for plain browse only (no name/date/guest/level filters). Do NOT use for search/filter or date availability — use find_room instead. After calling: (1) pass result.roomIds to update_room_list (IDs only — never rebuild room objects), (2) always reply in chat with one short sentence that rooms are ready — never end the turn with tools only.",
  inputSchema: getRoomsInputSchema,
  outputSchema: getRoomsOutputSchema,
  execute: async () => {
    console.log('----GET ROOMS TOOL EXECUTED----');
    const rooms = await getRooms();
    return { rooms };
  },
  toModelOutput: toGetRoomsModelOutput,
});
