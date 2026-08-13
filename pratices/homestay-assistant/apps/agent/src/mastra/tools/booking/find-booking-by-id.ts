import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import { sanitizeBookingId } from "@repo/utils";
import {
  findBookingByIdInputSchema,
  findBookingByIdOutputSchema,
} from "@/mastra/schemas/booking";
import { REQUEST_CONTEXT_KEYS } from "@/mastra/middleware/constants";
import { findBookingById } from "@/mastra/services";
import {
  clearPinnedStay,
  readPinnedBookingId,
} from "@/mastra/utils/resolve-pinned-stay";
import {
  serviceContextFromTool,
  throwIfAborted,
} from "@/mastra/utils/abort";

export const findBookingByIdTool = createTool({
  id: TOOL_KEYS.BOOKING.FIND_BY_ID,
  description:
    "Find the signed-in user's active booking by booking ID. Use when bookingId: is in the message — including [booking-cancel] / [booking-modify] from BookingCard clicks. Pass the UUID after bookingId: — never the room name or roomId (a room can have multiple bookings). CANCEL: when bookings.length > 0, in the SAME turn call show_cancel_dialog_confirm with bookings + queryName as-is. MODIFY: when bookings.length > 0 and result.room is present, do NOT ask in chat what to change and do NOT call get_room_by_id. If the guest already stated the new check-in/check-out/guests, skip edit_modify_booking: merge those values over bookings[0]. When the merged stay equals the current stay (same dates and guests — e.g. change guests to 1 when already 1), call nothing and reply with ONE short sentence that the booking already has those details — do NOT suggest other changes, do NOT open a form, do NOT call check_room_availability or CONFIRM_MODIFY_BOOKING. When the merged guests exceed result.room.capacity, call nothing and reply that the room sleeps at most that many guests. Otherwise call check_room_availability with flow=modify + excludeBookingId in the SAME turn. When no new values were stated, in the SAME turn call edit_modify_booking with bookingId, room, and current checkInDate/checkOutDate/guests from bookings[0]. If bookings.length === 0 → reply in chat with a user-friendly error; do not open cancel/modify dialogs. After show_modify_dialog_select confirmed:true, use bookingId from that result (prepareStep may pin it).",
  inputSchema: findBookingByIdInputSchema,
  outputSchema: findBookingByIdOutputSchema,
  execute: async ({ bookingId }, context) => {
    throwIfAborted(context.abortSignal);

    // Prefer the id pinned by prepareStep from the modify picker / sole match.
    const pinnedBookingId = readPinnedBookingId(
      context.requestContext,
      REQUEST_CONTEXT_KEYS.PENDING_MODIFY_BOOKING_ID,
    );

    clearPinnedStay(
      context.requestContext,
      REQUEST_CONTEXT_KEYS.PENDING_MODIFY_BOOKING_ID,
    );

    const id = sanitizeBookingId(pinnedBookingId ?? bookingId);

    return await findBookingById(id, serviceContextFromTool(context));
  },
});
