import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import { getAvailableRooms, getRooms } from "../../../services/rooms-service";
import {
  getRoomsInputSchema,
  getRoomsOutputSchema,
  getAvailableRoomsInputSchema,
  getAvailableRoomsOutputSchema,
} from "../../schemas/rooms";

export const getRoomsTool = createTool({
  id: TOOL_KEYS.GET.ROOMS,
  description: "Get all rooms in the homestay booking system",
  inputSchema: getRoomsInputSchema,
  outputSchema: getRoomsOutputSchema,
  execute: async () => {
    const rooms = await getRooms();
    return { rooms };
  },
});

export const getAvailableRoomsTool = createTool({
  id: TOOL_KEYS.GET.AVAILABLE_ROOMS,
  description: "Get all available rooms for a given check-in date",
  inputSchema: getAvailableRoomsInputSchema,
  outputSchema: getAvailableRoomsOutputSchema,
  execute: async (inputData) => {
    const { date } = inputData;
    const rooms = await getAvailableRooms(date);
    return { rooms };
  },
});
