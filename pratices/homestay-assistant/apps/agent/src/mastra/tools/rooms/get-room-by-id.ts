import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import { getRoom } from "@/mastra/services";
import { getRoomDetailInputSchema, getRoomDetailOutputSchema } from "@/mastra/schemas/rooms";

export const getRoomByIdTool = createTool({
  id: TOOL_KEYS.BOOKING.GET_ROOM_BY_ID,
  description:
    "Fetch the complete room object by its unique roomId. Use only when the guest explicitly requests room details or when roomId is provided. Never use for search/filter requests.",
  inputSchema: getRoomDetailInputSchema,
  outputSchema: getRoomDetailOutputSchema,
  execute: async (inputData) => {
    const { roomId } = inputData;
    const room = await getRoom(roomId);
    return { room };
  },
});