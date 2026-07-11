import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import { bookingSchema, cancelBookingInputSchema } from "@/mastra/schemas/booking";
import { cancelBooking } from "@/mastra/services";

export const cancelBookingTool = createTool({
  id: TOOL_KEYS.BOOKING.CANCEL,
  description:
    "Cancel a booking by ID after the guest confirmed in delete-booking or show_cancel_dialog_confirm (confirmed: true). Then call getBookings → update_bookings_list → show_cancellation_success, and always finish with one short guest-facing chat sentence. Never call this before dialog confirm.",
  inputSchema: cancelBookingInputSchema,
  outputSchema: bookingSchema,
  execute: async ({ bookingId }) => cancelBooking(bookingId),
});
