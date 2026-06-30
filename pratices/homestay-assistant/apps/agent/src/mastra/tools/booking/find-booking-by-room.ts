import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import {
  findBookingByRoomInputSchema,
  findBookingByRoomOutputSchema,
} from "../../schemas/booking";
import { resolveAgentUserId } from "../../utils/resolve-agent-user-id";
import { findBookingByRoomName } from "../../../services";
import { mapFindBookingByRoomResult } from "./map-find-booking-result";

export const findBookingByRoomTool = createTool({
  id: TOOL_KEYS.BOOKING.FIND_BY_ROOM,
  description:
    "Find an active user booking by room name. Always call this before cancel-booking-by-room when the user wants to cancel by room name.",
  inputSchema: findBookingByRoomInputSchema,
  outputSchema: findBookingByRoomOutputSchema,
  execute: async ({ roomName }, context) => {
    const userId = resolveAgentUserId(
      context.agent?.resourceId,
      "Authentication required to find bookings for cancellation",
    );

    const result = await findBookingByRoomName(userId, roomName);
    return mapFindBookingByRoomResult(result);
  },
});
