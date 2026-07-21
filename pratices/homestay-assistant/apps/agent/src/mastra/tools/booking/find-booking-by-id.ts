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
      "Step 1 of cancel flow. Find the signed-in user's active booking by booking ID. Use for every cancel when bookingId: is in the message — including [booking-cancel] from BookingCard clicks. Pass the UUID after bookingId: — never the room name. MANDATORY step 2 in the SAME turn when bookings.length > 0: call show_cancel_dialog_confirm with result bookings + queryName as-is — wait for confirmed: true before cancel_booking. If bookings.length === 0 → do NOT call show_cancel_dialog_confirm; reply in chat with a user-friendly error.",
    inputSchema: findBookingByIdInputSchema,
    outputSchema: findBookingByIdOutputSchema,
    execute: async ({ bookingId }, context) => {
      const userId = resolveAgentUserId(
        context.agent?.resourceId,
        "Authentication required to find bookings for cancellation",
      );

      return await findBookingById(userId, sanitizeBookingId(bookingId));
    },
  });
