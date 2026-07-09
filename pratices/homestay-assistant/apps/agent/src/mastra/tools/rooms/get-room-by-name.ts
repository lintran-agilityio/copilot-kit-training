import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import { findRoomByName } from "@/mastra/services";
import {
  getRoomByNameInputSchema,
  getRoomByNameOutputSchema,
} from "@/mastra/schemas/rooms";

export const getRoomByNameTool = createTool({
  id: TOOL_KEYS.GET.ROOM_BY_NAME,
  description:
    "Find rooms by display name. Use rooms.length to decide next step: 0 = reply in chat; 1 = navigate_to_home_page + open_room_detail_drawer; >1 = pick-room-for-detail then UI tools with chosen room.",
  inputSchema: getRoomByNameInputSchema,
  outputSchema: getRoomByNameOutputSchema,
  execute: async ({ roomName }) => findRoomByName(roomName),
});
