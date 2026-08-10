import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import { sanitizeBookingId } from "@repo/utils";
import { cancelBookingInputSchema } from "@repo/schemas";
import { bookingSchema } from "@/mastra/schemas/booking";
import {
  assertOwnedActiveBooking,
  cancelBooking,
} from "@/mastra/services";
import { REQUEST_CONTEXT_KEYS } from "@/mastra/middleware/constants";
import { getAuthUserId } from "@/mastra/middleware/get-auth-user-id";
import {
  clearPinnedStay,
  readPinnedBookingId,
} from "@/mastra/utils/resolve-pinned-stay";
import {
  serviceContextFromTool,
  throwIfAborted,
} from "@/mastra/utils/abort";

export const cancelBookingTool = createTool({
  id: TOOL_KEYS.BOOKING.CANCEL,
  description:
    `Cancel a booking by ID after show_cancel_dialog_confirm returns confirmed: true.
    - Use bookingId from the confirm booking dialog result.
    - After success, send one short guest-facing chat confirmation.
    - Do NOT call get_bookings or show_cancellation_success — the same HITL card updates to success/failed and refreshes the bookings list automatically.
    - Never call this before show_cancel_dialog_confirm returns confirmed: true.
    - Only the signed-in owner's active (non-past) bookings can be cancelled.`,
  inputSchema: cancelBookingInputSchema,
  outputSchema: bookingSchema,
  execute: async ({ bookingId }, context) => {
    throwIfAborted(context.abortSignal);

    const userId = getAuthUserId(
      context,
      "Authentication required to cancel a booking",
    );
    const serviceContext = serviceContextFromTool(context);

    // Prefer the id pinned by prepareStep from the cancel dialog — the model
    // often reuses a stale booking id when toolChoice forces this call.
    const pinnedBookingId = readPinnedBookingId(
      context.requestContext,
      REQUEST_CONTEXT_KEYS.PENDING_CANCEL_BOOKING_ID,
    );

    clearPinnedStay(
      context.requestContext,
      REQUEST_CONTEXT_KEYS.PENDING_CANCEL_BOOKING_ID,
    );

    const id = sanitizeBookingId(pinnedBookingId ?? bookingId);

    await assertOwnedActiveBooking(userId, id, serviceContext);

    // Side-effect: re-check immediately before committing the cancellation.
    throwIfAborted(context.abortSignal);

    return await cancelBooking(id, serviceContext);
  },
});
