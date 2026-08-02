import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import { sanitizeBookingId } from "@repo/utils";
import {
  bookingSchema,
  updateBookingSchema,
} from "@/mastra/schemas/booking";
import {
  assertOwnedActiveBooking,
  updateBooking,
} from "@/mastra/services";
import { getAuthUserId } from "@/mastra/middleware/get-auth-user-id";

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
  inputSchema: updateBookingSchema,
  outputSchema: bookingSchema,
  execute: async ({ bookingId, checkInDate, checkOutDate, guests }, context) => {
    console.log("----UPDATE BOOKING TOOL EXECUTED----");
    const userId = getAuthUserId(
      context,
      "Authentication required to update a booking",
    );
    const serviceContext = { requestContext: context.requestContext };
    const id = sanitizeBookingId(bookingId);

    await assertOwnedActiveBooking(userId, id, serviceContext);
    return await updateBooking(
      {
        bookingId: id,
        checkInDate,
        checkOutDate,
        guests,
      },
      serviceContext,
    );
  },
});
