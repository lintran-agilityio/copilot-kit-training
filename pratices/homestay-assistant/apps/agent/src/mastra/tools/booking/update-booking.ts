import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import { sanitizeBookingId } from "@repo/utils";
import { updateBookingInputSchema } from "@repo/schemas";
import { bookingMutationOutputSchema } from "@/mastra/schemas/booking";
import {
  assertOwnedModifiableBooking,
  updateBooking,
} from "@/mastra/services";
import { REQUEST_CONTEXT_KEYS } from "@/mastra/middleware/constants";
import { takePinnedStay } from "@/mastra/utils/resolve-pinned-stay";
import {
  commitIfNotAborted,
  runBookingMutation,
  serviceContextFromTool,
  throwIfAborted,
} from "@/mastra/utils/abort";
import { MUTATION_SUCCESS_HITL_REPLY_REQUIREMENT } from "@/mastra/constants";

export const updateBookingTool = createTool({
  id: TOOL_KEYS.BOOKING.UPDATE_BOOKING,
  description:
    `Update an existing booking's dates/guests by bookingId after CONFIRM_MODIFY_BOOKING returns confirmed: true — only the signed-in owner's active bookings whose check-in has not started yet can be updated (throws once check-in is today or past). roomId is not updatable.
    - Use bookingId, checkInDate, checkOutDate, and guests from the CONFIRM_MODIFY_BOOKING result.
    - ${MUTATION_SUCCESS_HITL_REPLY_REQUIREMENT}
    - Do NOT call get_bookings — the same HITL card updates to success/failed and refreshes the bookings list automatically.`,
  inputSchema: updateBookingInputSchema,
  outputSchema: bookingMutationOutputSchema,
  execute: async (params, context) => {
    throwIfAborted(context.abortSignal);
    const serviceContext = serviceContextFromTool(context);
    const { bookingId, checkInDate, checkOutDate, guests } = params;

    // Prefer the HITL confirm result pinned by prepareStep — the model often
    // reuses stale draft/original dates when toolChoice forces this call.
    const pinned = takePinnedStay(
      context.requestContext,
      REQUEST_CONTEXT_KEYS.PENDING_UPDATE_STAY,
    );
    const resolvedBookingId = sanitizeBookingId(
      pinned?.bookingId ?? bookingId,
    );
    const resolvedCheckIn = pinned?.checkInDate ?? checkInDate;
    const resolvedCheckOut = pinned?.checkOutDate ?? checkOutDate;
    const resolvedGuests = pinned?.guests ?? guests;

    return runBookingMutation(async () => {
      await assertOwnedModifiableBooking(resolvedBookingId, serviceContext);

      return commitIfNotAborted(context.abortSignal, () =>
        updateBooking(
          {
            bookingId: resolvedBookingId,
            checkInDate: resolvedCheckIn,
            checkOutDate: resolvedCheckOut,
            guests: resolvedGuests,
          },
          serviceContext,
        ),
      );
    });
  },
});
