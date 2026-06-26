// Libs
import { z } from "zod";
import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import { bookingSchema } from "../../schemas/booking";
import { getBookings } from "../../../services/booking.services";

const getBookingsInputSchema = z.object({
  userId: z.string().optional().describe("Filter by user ID from context"),
});

export const getBookingsTool = createTool({
  id: TOOL_KEYS.BOOKING.GET,
  description: "Get bookings, optionally filtered by user ID",
  inputSchema: getBookingsInputSchema,
  outputSchema: z.object({
    bookings: z.array(bookingSchema),
  }),
  execute: async ({ userId }) => {
    const bookings = await getBookings(userId);
    return { bookings };
  },
});
