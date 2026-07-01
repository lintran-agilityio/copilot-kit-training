import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import { findRoomByName } from "../../../services";
import {
  getRoomByNameInputSchema,
  getRoomByNameOutputSchema,
} from "../../schemas/rooms";

export const getRoomByNameTool = createTool({
  id: TOOL_KEYS.GET.ROOM_BY_NAME,
  description:
    "Find a room by display name. Returns rooms array and queryName. Use rooms.length before open_room_detail_drawer or pick-room-for-detail.",
  inputSchema: getRoomByNameInputSchema,
  outputSchema: getRoomByNameOutputSchema,
  execute: async ({ roomName }) => findRoomByName(roomName),
});
