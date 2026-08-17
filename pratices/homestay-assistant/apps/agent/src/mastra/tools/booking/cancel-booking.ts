import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import { sanitizeBookingId } from "@repo/utils";
import { cancelBookingInputSchema } from "@repo/schemas";
import { bookingSchema } from "@/mastra/schemas/booking";
import { assertOwnedActiveBooking, cancelBooking } from "@/mastra/services";
import { REQUEST_CONTEXT_KEYS } from "@/mastra/middleware/constants";
import { takePinnedBookingId } from "@/mastra/utils/resolve-pinned-stay";
import {
  commitIfNotAborted,
  serviceContextFromTool,
  throwIfAborted,
} from "@/mastra/utils/abort";
import { MUTATION_SUCCESS_HITL_REPLY_REQUIREMENT } from "@/mastra/utils/generic-ui-reply-hints";

export const cancelBookingTool = createTool({
  id: TOOL_KEYS.BOOKING.CANCEL,
  description: `
    Cancel a booking by ID after show_cancel_dialog_confirm returns confirmed: true — only the signed-in owner's active (non-past) bookings can be cancelled.
      - Use bookingId from the show_cancel_dialog_confirm result.
      - ${MUTATION_SUCCESS_HITL_REPLY_REQUIREMENT}
      - Do NOT call get_bookings or show_cancellation_success — the same HITL card updates to success/failed and refreshes the bookings list automatically.
    `,
  inputSchema: cancelBookingInputSchema,
  outputSchema: bookingSchema,
  execute: async ({ bookingId }, context) => {
    const { requestContext, abortSignal } = context;
    throwIfAborted(abortSignal);

    const serviceContext = serviceContextFromTool(context);

    // Prefer the id pinned by prepareStep from the cancel dialog — the model
    // often reuses a stale booking id when toolChoice forces this call.
    const pinnedBookingId = takePinnedBookingId(
      requestContext,
      REQUEST_CONTEXT_KEYS.PENDING_CANCEL_BOOKING_ID,
    );

    const id = sanitizeBookingId(pinnedBookingId ?? bookingId);

    await assertOwnedActiveBooking(id, serviceContext);

    return commitIfNotAborted(abortSignal, () =>
      cancelBooking(id, serviceContext),
    );
  },
});
