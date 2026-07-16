import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import { sanitizeBookingId } from "@repo/utils";
import { bookingSchema, cancelBookingInputSchema } from "@/mastra/schemas/booking";
import { cancelBooking } from "@/mastra/services";

export const cancelBookingTool = createTool({
  id: TOOL_KEYS.BOOKING.CANCEL,
  description:
    "Cancel a booking by ID after show_cancel_dialog_confirm returns confirmed: true. Use bookingId from the HITL result. Then call getBookings → update_bookings_list with result.bookings → show_cancellation_success with the room name from this result. Always finish with one short guest-facing chat sentence naming the room. Never call this before show_cancel_dialog_confirm returns confirmed: true.",
  inputSchema: cancelBookingInputSchema,
  outputSchema: bookingSchema,
  execute: async ({ bookingId }) => {
    const result = await cancelBooking(sanitizeBookingId(bookingId));
    console.log("CANCEL BOOKING TOOL RESULT", result);
    return result;
  },
});
