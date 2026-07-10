import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import { getRoom } from "@/mastra/services";
import { getRoomDetailInputSchema, getRoomDetailOutputSchema } from "@/mastra/schemas/rooms";

export const getRoomByIdTool = createTool({
  id: TOOL_KEYS.GET.ROOM,
  description:
    "Fetch a room by ID when you need the full room object for a detail/browse intent. For booking, prefer checkRoomAvailability which already returns the full room — do not call this just to stage open_confirm_booking. Detail intent: open_room_detail_drawer with result.room (call navigate_to_home_page first ONLY if on bookings page). Always finish with one short guest-facing chat reply.",
  inputSchema: getRoomDetailInputSchema,
  outputSchema: getRoomDetailOutputSchema,
  execute: async (inputData) => {
    const { roomId } = inputData;
    const room = await getRoom(roomId);
    return { room };
  },
});