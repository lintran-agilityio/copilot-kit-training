import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import { getRoom } from "@/mastra/services";
import { getRoomDetailInputSchema, getRoomDetailOutputSchema } from "@/mastra/schemas/rooms";

export const getRoomByIdTool = createTool({
  id: TOOL_KEYS.GET.ROOM,
  description:
    "Fetch a room by ID for detail/browse. Use when the message has roomId:, or after matching a room by name via getRooms. RoomDetail renders automatically from this tool result — do NOT call show_room_detail. Always finish with one short guest-facing chat reply.",
  inputSchema: getRoomDetailInputSchema,
  outputSchema: getRoomDetailOutputSchema,
  execute: async (inputData) => {
    const { roomId } = inputData;
    const room = await getRoom(roomId);
    return { room };
  },
});