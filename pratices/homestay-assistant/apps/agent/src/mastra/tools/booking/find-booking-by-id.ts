import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import { TOOL_PURPOSE } from "@repo/constants";
import { sanitizeBookingId } from "@repo/utils";
import {
  findBookingByIdInputSchema,
  findBookingByIdOutputSchema,
} from "@/mastra/schemas/booking";
import { REQUEST_CONTEXT_KEYS } from "@/mastra/middleware/constants";
import { findBookingById } from "@/mastra/services";
import {
  takePinnedBookingId,
  takePinnedModifyRequestedFields,
} from "@/mastra/utils/resolve-pinned-stay";
import {
  serviceContextFromTool,
  throwIfAborted,
} from "@/mastra/utils/abort";

export const findBookingByIdTool = createTool({
  id: TOOL_KEYS.BOOKING.FIND_BY_ID,
  description: `
    Look up one specific active booking by its ID, for a CANCEL or MODIFY action.
      - Use only when a bookingId is already known — a bookingId: value in the message (including [booking-cancel] / [booking-modify] from BookingCard clicks), or a booking id chosen via a prior find_bookings result. If you only have a room name (no id), call find_bookings instead. For a guest-facing "show/list my bookings" request, call get_bookings instead — never this tool.
      - purpose selects CANCEL vs MODIFY eligibility rules; see the purpose parameter.
      - For MODIFY, also set requestedCheckInDate / requestedCheckOutDate / requestedGuests when the guest's LATEST message states a new value for that field; see those parameters for how the app uses them.
    `,
  inputSchema: findBookingByIdInputSchema,
  outputSchema: findBookingByIdOutputSchema,
  execute: async (
    { bookingId, purpose, requestedCheckInDate, requestedCheckOutDate, requestedGuests },
    context,
  ) => {
    throwIfAborted(context.abortSignal);

    // Prefer the id pinned by prepareStep from the modify picker / sole match.
    // Both pins below are MODIFY-only — never set for a CANCEL call — but the
    // purpose check makes that a structural guarantee, not just a coincidence
    // of what step-machine happens to set today.
    const isModify = purpose === TOOL_PURPOSE.FIND_BOOKING_BY_ID.MODIFY;
    const pinnedBookingId = isModify
      ? takePinnedBookingId(context.requestContext, REQUEST_CONTEXT_KEYS.PENDING_MODIFY_BOOKING_ID)
      : null;
    // Same idea for the requested-change fields: a picker pick's forced
    // follow-up call shouldn't have to re-derive what the guest already
    // stated before the picker opened — fall back to what was pinned then.
    const pinnedRequestedFields = isModify
      ? takePinnedModifyRequestedFields(context.requestContext, REQUEST_CONTEXT_KEYS.PENDING_MODIFY_REQUESTED_FIELDS)
      : null;

    const id = sanitizeBookingId(pinnedBookingId ?? bookingId);
    const resolvedCheckInDate = isModify ? requestedCheckInDate ?? pinnedRequestedFields?.checkInDate : undefined;
    const resolvedCheckOutDate = isModify ? requestedCheckOutDate ?? pinnedRequestedFields?.checkOutDate : undefined;
    const resolvedGuests = isModify ? requestedGuests ?? pinnedRequestedFields?.guests : undefined;

    const result = await findBookingById(id, serviceContextFromTool(context), purpose);
    return {
      ...result,
      ...(resolvedCheckInDate ? { requestedCheckInDate: resolvedCheckInDate } : {}),
      ...(resolvedCheckOutDate ? { requestedCheckOutDate: resolvedCheckOutDate } : {}),
      ...(resolvedGuests !== undefined ? { requestedGuests: resolvedGuests } : {}),
    };
  },
});
