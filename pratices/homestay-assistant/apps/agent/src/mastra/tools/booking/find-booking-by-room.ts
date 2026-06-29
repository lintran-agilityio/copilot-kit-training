import { createTool } from "@mastra/core/tools";
import { parseThreadResourceId } from "@repo/utils";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import {
  findBookingByRoomInputSchema,
  findBookingByRoomOutputSchema,
} from "../../schemas/booking";
import { findBookingByRoomName } from "../../../services";

export const findBookingByRoomTool = createTool({
  id: TOOL_KEYS.BOOKING.FIND_BY_ROOM,
  description:
    "Find an active user booking by room name. Always call this before cancel-booking-by-room when the user wants to cancel by room name.",
  inputSchema: findBookingByRoomInputSchema,
  outputSchema: findBookingByRoomOutputSchema,
  execute: async ({ roomName }, context) => {
    const resourceId = context.agent?.resourceId;

    if (!resourceId) {
      throw new Error("Authentication required to find bookings for cancellation");
    }

    const { userId } = parseThreadResourceId(resourceId);
    const result = await findBookingByRoomName(userId, roomName);

    if (result.status === "found") {
      return {
        status: "found" as const,
        message: `Found booking for ${result.booking.roomName} (${result.booking.checkInDate} to ${result.booking.checkOutDate}).`,
        booking: result.booking,
      };
    }

    if (result.status === "ambiguous") {
      return {
        status: "ambiguous" as const,
        message: result.message,
        candidates: result.bookings,
      };
    }

    return {
      status: "not_found" as const,
      message: result.message,
    };
  },
});
