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
    `Find rooms by display name. Use rooms.length and the guest intent to decide next step:
      - 0 = reply in chat;
      - 1 + detail/browse intent = open_room_detail_drawer (call navigate_to_home_page first ONLY if on bookings page);
      - 1 + book intent (dates/guests given) = use rooms[0].id with checkRoomAvailability (include guests from the latest message) → open_confirm_booking if available, else show_booking_unavailable + chat reply; do NOT call open_room_detail_drawer;
      - >1 = pick-room-for-detail then follow the same intent rules with the chosen room.
    Always finish with one short guest-facing chat reply.`,
  inputSchema: getRoomByNameInputSchema,
  outputSchema: getRoomByNameOutputSchema,
  execute: async ({ roomName }) => findRoomByName(roomName),
});
