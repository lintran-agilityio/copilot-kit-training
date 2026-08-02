// Libs
import { z } from "zod";
import { createTool } from "@mastra/core/tools";
import { BookingStatus } from "@repo/types";
import { getAuthUserId } from "@/mastra/middleware/get-auth-user-id";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import { bookingSchema } from "@/mastra/schemas/booking";
import {
  getBookings,
  type GetBookingsParams,
} from "@/mastra/services";

const getBookingsInputSchema = z.object({
  roomId: z.string().optional().describe("Filter by room ID"),
  status: z
    .enum(Object.values(BookingStatus) as [string, ...string[]])
    .optional()
    .describe("Filter by booking status"),
});

export const getBookingsTool = createTool({
  id: TOOL_KEYS.BOOKING.GET,
  description:
    "Get the signed-in user's bookings from the backend. User identity always comes from the server session — never pass or invent a userId. After calling, always finish with one short guest-facing chat sentence.",
  inputSchema: getBookingsInputSchema,
  outputSchema: z.object({
    bookings: z.array(bookingSchema),
  }),
  execute: async (params, context) => {
    console.log("----GET BOOKINGS TOOL EXECUTED----");
    const userId = getAuthUserId(
      context,
      "Authentication required to fetch bookings",
    );

    const bookings = await getBookings(
      {
        userId,
        roomId: params.roomId,
        status: params.status as GetBookingsParams["status"],
      },
      { requestContext: context.requestContext },
    );

    return { bookings };
  },
});
