import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import { sanitizeBookingId } from "@repo/utils";
import {
  findBookingByIdInputSchema,
  findBookingByIdOutputSchema,
} from "@/mastra/schemas/booking";
import { REQUEST_CONTEXT_KEYS } from "@/mastra/middleware/constants";
import { findBookingById } from "@/mastra/services";
import { takePinnedBookingId } from "@/mastra/utils/resolve-pinned-stay";
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
  execute: async ({ bookingId, purpose }, context) => {
    throwIfAborted(context.abortSignal);

    // Prefer the id pinned by prepareStep from the modify picker / sole match.
    const pinnedBookingId = takePinnedBookingId(
      context.requestContext,
      REQUEST_CONTEXT_KEYS.PENDING_MODIFY_BOOKING_ID,
    );

    const id = sanitizeBookingId(pinnedBookingId ?? bookingId);

    return await findBookingById(id, serviceContextFromTool(context), purpose);
  },
});
