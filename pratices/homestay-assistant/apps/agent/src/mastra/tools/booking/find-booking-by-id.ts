import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import { sanitizeBookingId } from "@repo/utils";
import {
  findBookingByIdInputSchema,
  findBookingByIdOutputSchema,
} from "@/mastra/schemas/booking";
import { resolveAgentUserId } from "@/mastra/utils/resolve-agent-user-id";
import { findBookingById } from "@/mastra/services";

export const findBookingByIdTool = createTool({
  id: TOOL_KEYS.BOOKING.FIND_BY_ID,
  description:
    "Find the signed-in user's active booking by booking ID. Use when bookingId: is in the message — including [booking-cancel] / [booking-modify] from BookingCard clicks. Pass the UUID after bookingId: — never the room name or roomId (a room can have multiple bookings). CANCEL: when bookings.length > 0, in the SAME turn call show_cancel_dialog_confirm with bookings + queryName as-is. MODIFY: when bookings.length > 0 and result.room is present, in the SAME turn call edit_modify_booking with bookingId, room, and current checkInDate/checkOutDate/guests from bookings[0] — do NOT ask in chat what to change; do NOT call get_room_by_id. If bookings.length === 0 → reply in chat with a user-friendly error; do not open cancel/modify dialogs.",
  inputSchema: findBookingByIdInputSchema,
  outputSchema: findBookingByIdOutputSchema,
  execute: async ({ bookingId }, context) => {
    const userId = resolveAgentUserId(
      context.agent?.resourceId,
      "Authentication required to find bookings",
    );

    return await findBookingById(userId, sanitizeBookingId(bookingId));
  },
});
