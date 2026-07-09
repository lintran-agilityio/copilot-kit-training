import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import { bookingSchema, cancelBookingInputSchema } from "@/mastra/schemas/booking";
import { cancelBooking } from "@/mastra/services";

export const cancelBookingTool = createTool({
  id: TOOL_KEYS.BOOKING.DELETE,
  description:
    "Cancel a booking by ID after the user confirmed in the dialog. Then call getBookings, update_bookings_list, and show_cancellation_success.",
  inputSchema: cancelBookingInputSchema,
  outputSchema: bookingSchema,
  execute: async ({ bookingId }) => cancelBooking(bookingId),
});
