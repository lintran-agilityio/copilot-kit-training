import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import { sanitizeBookingId } from "@repo/utils";
import { updateBookingInputSchema } from "@repo/schemas";
import { bookingSchema } from "@/mastra/schemas/booking";
import {
  assertOwnedActiveBooking,
  updateBooking,
} from "@/mastra/services";
import { REQUEST_CONTEXT_KEYS } from "@/mastra/middleware/constants";
import {
  clearPinnedStay,
  readPinnedStay,
} from "@/mastra/utils/resolve-pinned-stay";
import {
  serviceContextFromTool,
  throwIfAborted,
} from "@/mastra/utils/abort";
import { MUTATION_SUCCESS_HITL_REPLY_REQUIREMENT } from "@/mastra/utils/generic-ui-reply-hints";

export const updateBookingTool = createTool({
  id: TOOL_KEYS.BOOKING.UPDATE_BOOKING,
  description:
    `Update an existing booking by bookingId after CONFIRM_MODIFY_BOOKING returns confirmed: true.
    - Use bookingId, checkInDate, checkOutDate, and guests from the CONFIRM_MODIFY_BOOKING result.
    - Never change the room — roomId is not updatable.
    - Never call this to create a new booking.
    - ${MUTATION_SUCCESS_HITL_REPLY_REQUIREMENT}
    - Do NOT call get_bookings — the same HITL card updates to success/failed and refreshes the bookings list automatically.
    - Never call this before CONFIRM_MODIFY_BOOKING returns confirmed: true.
    - Only the signed-in owner's active (non-past) bookings can be updated.`,
  inputSchema: updateBookingInputSchema,
  outputSchema: bookingSchema,
  execute: async ({ bookingId, checkInDate, checkOutDate, guests }, context) => {
    throwIfAborted(context.abortSignal);

    const serviceContext = serviceContextFromTool(context);

    // Prefer the HITL confirm result pinned by prepareStep — the model often
    // reuses stale draft/original dates when toolChoice forces this call.
    const pinned = readPinnedStay(
      context.requestContext,
      REQUEST_CONTEXT_KEYS.PENDING_UPDATE_STAY,
    );
    const resolvedBookingId = sanitizeBookingId(
      pinned?.bookingId ?? bookingId,
    );
    const resolvedCheckIn = pinned?.checkInDate ?? checkInDate;
    const resolvedCheckOut = pinned?.checkOutDate ?? checkOutDate;
    const resolvedGuests = pinned?.guests ?? guests;

    clearPinnedStay(
      context.requestContext,
      REQUEST_CONTEXT_KEYS.PENDING_UPDATE_STAY,
    );

    await assertOwnedActiveBooking(resolvedBookingId, serviceContext);

    // Side-effect: re-check immediately before committing the update.
    throwIfAborted(context.abortSignal);

    return await updateBooking(
      {
        bookingId: resolvedBookingId,
        checkInDate: resolvedCheckIn,
        checkOutDate: resolvedCheckOut,
        guests: resolvedGuests,
      },
      serviceContext,
    );
  },
});
