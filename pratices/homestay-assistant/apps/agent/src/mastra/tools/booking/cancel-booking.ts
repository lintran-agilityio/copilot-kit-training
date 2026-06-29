import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import { bookingSchema, cancelBookingInputSchema } from "../../schemas/booking";
import { cancelBooking } from "../../../services";

export const cancelBookingTool = createTool({
  id: TOOL_KEYS.BOOKING.DELETE,
  description:
    "Cancel a booking by ID. Use only after the user has confirmed they want to remove the reservation.",
  inputSchema: cancelBookingInputSchema,
  outputSchema: bookingSchema,
  execute: async ({ bookingId }) => cancelBooking(bookingId),
});
