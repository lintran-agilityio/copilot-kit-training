import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import { sanitizeBookingId } from "@repo/utils";
import { bookingSchema, cancelBookingInputSchema } from "@/mastra/schemas/booking";
import { cancelBooking, findBookingById } from "@/mastra/services";
import { resolveAgentUserId } from "@/mastra/utils/resolve-agent-user-id";

export const cancelBookingTool = createTool({
  id: TOOL_KEYS.BOOKING.CANCEL,
  description:
    `Cancel a booking by ID after show_cancel_dialog_confirm returns confirmed: true.
    - Use bookingId from the HITL result.
    - After success, send one short guest-facing chat confirmation.
    - Do NOT call get_bookings or show_cancellation_success — the UI shows success and refreshes the bookings list automatically.
    - Never call this before show_cancel_dialog_confirm returns confirmed: true.`,
  inputSchema: cancelBookingInputSchema,
  outputSchema: bookingSchema,
  execute: async ({ bookingId }, context) => {
    const userId = resolveAgentUserId({
      requestContext: context.requestContext,
      resourceId: context.agent?.resourceId,
      errorMessage: "Authentication required to cancel a booking",
    });

    const id = sanitizeBookingId(bookingId);
    const owned = await findBookingById(userId, id);

    if (owned.bookings.length === 0) {
      throw new Error("Booking not found or you do not have permission to cancel it");
    }

    return await cancelBooking(id);
  },
});
