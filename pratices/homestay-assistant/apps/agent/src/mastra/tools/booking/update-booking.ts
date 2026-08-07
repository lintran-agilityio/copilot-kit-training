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
import { getAuthUserId } from "@/mastra/middleware/get-auth-user-id";
import {
  clearPinnedStay,
  readPinnedStay,
} from "@/mastra/utils/resolve-pinned-stay";
import {
  serviceContextFromTool,
  throwIfAborted,
} from "@/mastra/utils/abort";

export const updateBookingTool = createTool({
  id: TOOL_KEYS.BOOKING.UPDATE_BOOKING,
  description:
    `Update an existing booking by bookingId after confirm_modify_booking returns confirmed: true.
    - Use bookingId, checkInDate, checkOutDate, and guests from the confirm_modify_booking result.
    - Never change the room — roomId is not updatable.
    - Never call this to create a new booking.
    - After success, send one short guest-facing chat confirmation.
    - Do NOT call get_bookings — the UI shows ConfirmSuccess and refreshes the bookings list automatically.
    - Never call this before confirm_modify_booking returns confirmed: true.
    - Only the signed-in owner's active (non-past) bookings can be updated.`,
  inputSchema: updateBookingInputSchema,
  outputSchema: bookingSchema,
  execute: async ({ bookingId, checkInDate, checkOutDate, guests }, context) => {
    throwIfAborted(context.abortSignal);

    const userId = getAuthUserId(
      context,
      "Authentication required to update a booking",
    );
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

    await assertOwnedActiveBooking(userId, resolvedBookingId, serviceContext);

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
