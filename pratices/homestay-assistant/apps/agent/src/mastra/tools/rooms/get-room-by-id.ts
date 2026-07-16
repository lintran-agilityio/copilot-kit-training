import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import { getRoom } from "@/mastra/services";
import { getRoomDetailInputSchema, getRoomDetailOutputSchema } from "@/mastra/schemas/rooms";

export const getRoomByIdTool = createTool({
  id: TOOL_KEYS.GET.ROOM,
  description:
    "Fetch a room by ID when resolving a room by name (no roomId: in the message). For detail/browse when roomId: is already in the message, call show_room_detail with { roomId } instead — do not call this tool. After fetch for name lookup, call show_room_detail with result.room. Always finish with one short guest-facing chat reply.",
  inputSchema: getRoomDetailInputSchema,
  outputSchema: getRoomDetailOutputSchema,
  execute: async (inputData) => {
    const { roomId } = inputData;
    const room = await getRoom(roomId);
    return { room };
  },
});