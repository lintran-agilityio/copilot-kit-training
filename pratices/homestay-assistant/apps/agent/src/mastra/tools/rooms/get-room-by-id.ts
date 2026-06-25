import { createTool } from "@mastra/core/tools";
import { TOOL_KEYS } from "@repo/constants/tool-keys";
import { getRoom } from "../../../services/rooms-service";
import { getRoomDetailInputSchema, getRoomDetailOutputSchema } from "../../schemas/rooms/getRoomDetail.schema";

export const getRoomByIdTool = createTool({
  id: TOOL_KEYS.GET.ROOM,
  description: "Get detailed information about a room by its ID. Call getRooms first when the user refers to a room by name so you can resolve the correct roomId.",
  inputSchema: getRoomDetailInputSchema,
  outputSchema: getRoomDetailOutputSchema,
  execute: async (inputData) => {
    const { roomId } = inputData;
    const room = await getRoom(roomId);
    return { room };
  },
});