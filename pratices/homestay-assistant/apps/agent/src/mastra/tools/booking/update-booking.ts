import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import { sanitizeBookingId } from "@repo/utils";
import {
  bookingSchema,
  updateBookingSchema,
} from "@/mastra/schemas/booking";
import { updateBooking } from "@/mastra/services";

export const updateBookingTool = createTool({
  id: TOOL_KEYS.BOOKING.UPDATE_BOOKING,
  description:
    `Update an existing booking by bookingId after confirm_modify_booking returns confirmed: true.
    - Use bookingId, checkInDate, checkOutDate, and guests from the confirm_modify_booking result.
    - Never change the room — roomId is not updatable.
    - Never call this to create a new booking.
    - After success, send one short guest-facing chat confirmation.
    - Do NOT call get_bookings — the UI shows ConfirmSuccess and refreshes the bookings list automatically.
    - Never call this before confirm_modify_booking returns confirmed: true.`,
  inputSchema: updateBookingSchema,
  outputSchema: bookingSchema,
  execute: async ({ bookingId, checkInDate, checkOutDate, guests }) => {
    return await updateBooking({
      bookingId: sanitizeBookingId(bookingId),
      checkInDate,
      checkOutDate,
      guests,
    });
  },
});
