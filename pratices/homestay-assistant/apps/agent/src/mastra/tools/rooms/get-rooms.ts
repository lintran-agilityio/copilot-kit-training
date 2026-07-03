import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import { getAvailableRooms, getRooms } from "../../services";
import {
  getRoomsInputSchema,
  getRoomsOutputSchema,
  getAvailableRoomsInputSchema,
  getAvailableRoomsOutputSchema,
} from "../../schemas/rooms";

export const getRoomsTool = createTool({
  id: TOOL_KEYS.GET.ROOMS,
  description:
    "Fetch all rooms. After calling, pass result.rooms to update_room_list and call navigate_to_home_page.",
  inputSchema: getRoomsInputSchema,
  outputSchema: getRoomsOutputSchema,
  execute: async () => {
    const rooms = await getRooms();
    return { rooms };
  },
});

export const getAvailableRoomsTool = createTool({
  id: TOOL_KEYS.GET.AVAILABLE_ROOMS,
  description:
    "Fetch rooms available for a check-in date (YYYY-MM-DD). After calling, pass result.rooms to update_room_list and call navigate_to_home_page.",
  inputSchema: getAvailableRoomsInputSchema,
  outputSchema: getAvailableRoomsOutputSchema,
  execute: async (inputData) => {
    const { date } = inputData;
    const rooms = await getAvailableRooms(date);
    return { rooms };
  },
});
