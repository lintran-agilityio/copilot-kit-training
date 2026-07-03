import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import {
  findBookingByNameInputSchema,
  findBookingByNameOutputSchema,
} from "../../schemas/booking";
import { resolveAgentUserId } from "../../utils/resolve-agent-user-id";
import { findBookingByRoomName } from "../../services";

export const findBookingByRoomTool = createTool({
  id: TOOL_KEYS.BOOKING.FIND_BY_ROOM,
  description:
    "Find active user bookings by room name. Returns bookings array and queryName. Use bookings.length before cancel-booking-by-room.",
  inputSchema: findBookingByNameInputSchema,
  outputSchema: findBookingByNameOutputSchema,
  execute: async ({ roomName }, context) => {
    const userId = resolveAgentUserId(
      context.agent?.resourceId,
      "Authentication required to find bookings for cancellation",
    );

    return findBookingByRoomName(userId, roomName);
  },
});
