// Libs
import { z } from "zod";
import { createTool } from "@mastra/core/tools";
import { BookingStatus } from "@repo/types";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import { bookingSchema } from "@/mastra/schemas/booking";
import {
  getBookings,
  type GetBookingsParams,
} from "@/mastra/services";
import { resolveAgentUserId } from "@/mastra/utils/resolve-agent-user-id";

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
    "Get the signed-in user's bookings from the backend. After calling, always finish with one short guest-facing chat sentence.",
  inputSchema: getBookingsInputSchema,
  outputSchema: z.object({
    bookings: z.array(bookingSchema),
  }),
  execute: async (params, context) => {
    const userId = resolveAgentUserId({
      requestContext: context.requestContext,
      resourceId: context.agent?.resourceId,
      errorMessage: "Authentication required to fetch bookings",
    });

    const bookings = await getBookings({
      userId,
      roomId: params.roomId,
      status: params.status as GetBookingsParams["status"],
    });

    return { bookings };
  },
});
