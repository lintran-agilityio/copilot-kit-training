import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import {
  findBookingByNameInputSchema,
  findBookingByNameOutputSchema,
} from "@/mastra/schemas/booking";
import { resolveAgentUserId } from "@/mastra/utils/resolve-agent-user-id";
import { findBookingByName } from "@/mastra/services";

export const findBookingByNameTool = createTool({
  id: TOOL_KEYS.BOOKING.FIND_BY_NAME,
  description:
    "Find the signed-in user's active bookings by room name. Pass the room display name (e.g. The Meridian); filler words like cancel/booking/room are OK — the API normalizes them. If bookings.length > 0 → call show_cancel_dialog_confirm with bookings + queryName as-is, then one short guest-facing chat sentence. If bookings.length === 0 → do NOT call show_cancel_dialog_confirm; reply in chat that no active booking matched and suggest the exact room name or viewing bookings. Never call cancelBooking until a dialog returns confirmed: true.",
  inputSchema: findBookingByNameInputSchema,
  outputSchema: findBookingByNameOutputSchema,
  execute: async ({ roomName }, context) => {
    const userId = resolveAgentUserId(
      context.agent?.resourceId,
      "Authentication required to find bookings for cancellation",
    );

    return findBookingByName(userId, roomName);
  },
});
