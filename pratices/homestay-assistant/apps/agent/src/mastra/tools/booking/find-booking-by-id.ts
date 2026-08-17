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
    Find the signed-in user's active booking(s) by booking ID.
      - Use when bookingId: is in the message — including [booking-cancel] / [booking-modify] from BookingCard clicks.
      - Pass the UUID after bookingId: — never the room name or roomId (a room can have multiple bookings).
      - Pass purpose: "modify" for MODIFY lookups — a booking whose check-in has already started comes back as bookings: [] with reason: "not_modifiable" so the edit form is never opened for it; reply that it can only be cancelled instead. Omit (or "cancel") for CANCEL lookups, which allow an already-started booking.
      - Returns bookings: [] when the booking is not found, not owned/active, or (purpose: "modify") not modifiable; result.room is included for MODIFY.
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
