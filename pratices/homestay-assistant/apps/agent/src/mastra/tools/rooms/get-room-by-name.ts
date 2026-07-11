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
      - 1 + detail/browse intent = show_room_detail with rooms[0] (renders RoomDetail in chat);
      - 1 + book intent (dates/guests given) = use rooms[0].id with checkRoomAvailability (include guests from the latest message) → open_confirm_booking if available, else show_booking_unavailable then chat reply after modal close; do NOT call show_room_detail;
      - >1 = pick-room-for-detail then follow the same intent rules with the chosen room.
    Always finish with one short guest-facing chat reply.`,
  inputSchema: getRoomByNameInputSchema,
  outputSchema: getRoomByNameOutputSchema,
  execute: async ({ roomName }) => findRoomByName(roomName),
});
