import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import { sanitizeBookingId } from "@repo/utils";
import { bookingSchema, cancelBookingInputSchema } from "@/mastra/schemas/booking";
import {
  assertOwnedActiveBooking,
  cancelBooking,
} from "@/mastra/services";
import { getAuthUserId } from "@/mastra/middleware/get-auth-user-id";

export const cancelBookingTool = createTool({
  id: TOOL_KEYS.BOOKING.CANCEL,
  description:
    `Open the cancel booking dialog and confirm the cancellation.
    - Cancel a booking by ID after show_cancel_dialog_confirm returns confirmed: true.
    - Use bookingId from the confirm booking dialog result.
    - After success, send one short guest-facing chat confirmation.
    - Do NOT call get_bookings or show_cancellation_success — the UI shows success and refreshes the bookings list automatically.
    - Never call this before show_cancel_dialog_confirm returns confirmed: true.
    - Only the signed-in owner's active (non-past) bookings can be cancelled.`,
  inputSchema: cancelBookingInputSchema,
  outputSchema: bookingSchema,
  execute: async ({ bookingId }, context) => {
    console.log("----CANCEL BOOKING TOOL EXECUTED----");
    const userId = getAuthUserId(
      context,
      "Authentication required to cancel a booking",
    );
    const serviceContext = { requestContext: context.requestContext };
    const id = sanitizeBookingId(bookingId);

    await assertOwnedActiveBooking(userId, id, serviceContext);
    return await cancelBooking(id, serviceContext);
  },
});
