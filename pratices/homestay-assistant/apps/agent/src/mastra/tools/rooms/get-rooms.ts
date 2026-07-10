import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import { getAvailableRooms, getRooms } from "@/mastra/services";
import {
  getRoomsInputSchema,
  getRoomsOutputSchema,
  getAvailableRoomsInputSchema,
  getAvailableRoomsOutputSchema,
} from "@/mastra/schemas/rooms";

export const getRoomsTool = createTool({
  id: TOOL_KEYS.GET.ROOMS,
  description:
    "Fetch all rooms. After calling: (1) pass result.rooms to update_room_list, (2) call navigate_to_home_page ONLY if the guest is on the bookings page (skip when already on home), (3) always reply in chat with one short sentence that rooms are ready — never end the turn with tools only.",
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
    "Fetch rooms available for a check-in date (YYYY-MM-DD). After calling: (1) pass result.rooms to update_room_list, (2) call navigate_to_home_page ONLY if the guest is on the bookings page (skip when already on home), (3) always reply in chat with one short sentence that available rooms are ready — never end the turn with tools only.",
  inputSchema: getAvailableRoomsInputSchema,
  outputSchema: getAvailableRoomsOutputSchema,
  execute: async (inputData) => {
    const { date } = inputData;
    const rooms = await getAvailableRooms(date);
    return { rooms };
  },
});
