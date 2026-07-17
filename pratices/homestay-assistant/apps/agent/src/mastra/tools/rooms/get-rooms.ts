import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import { getRooms } from "@/mastra/services";
import {
  getRoomsInputSchema,
  getRoomsOutputSchema,
} from "@/mastra/schemas/rooms";

export const getRoomsTool = createTool({
  id: TOOL_KEYS.GET.ROOMS,
  description:
    "Fetch all rooms for plain browse only (no name/date/guest/level filters). Do NOT use for search/filter or date availability — use find_room instead. After calling: (1) pass result.rooms to update_room_list, (2) call navigate_to_home_page ONLY if the guest is on the bookings page (skip when already on home), (3) always reply in chat with one short sentence that rooms are ready — never end the turn with tools only.",
  inputSchema: getRoomsInputSchema,
  outputSchema: getRoomsOutputSchema,
  execute: async () => {
    const rooms = await getRooms();
    return { rooms };
  },
});
