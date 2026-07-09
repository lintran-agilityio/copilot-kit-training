import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import { getRoom } from "@/mastra/services";
import { getRoomDetailInputSchema, getRoomDetailOutputSchema } from "@/mastra/schemas/rooms";

export const getRoomByIdTool = createTool({
  id: TOOL_KEYS.GET.ROOM,
  description:
    "Fetch a room by ID. Use when you have a room ID but not the full room object. Then call navigate_to_home_page and open_room_detail_drawer with result.room.",
  inputSchema: getRoomDetailInputSchema,
  outputSchema: getRoomDetailOutputSchema,
  execute: async (inputData) => {
    const { roomId } = inputData;
    const room = await getRoom(roomId);
    return { room };
  },
});