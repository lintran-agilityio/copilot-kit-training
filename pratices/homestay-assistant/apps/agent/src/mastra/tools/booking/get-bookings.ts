// Libs
import { z } from "zod";
import { createTool } from "@mastra/core/tools";
import { BookingStatus } from "@repo/types";
import { parseAgentResourceId } from "@repo/utils";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import { bookingSchema } from "@/mastra/schemas/booking";
import {
  getBookings,
  type GetBookingsParams,
} from "@/mastra/services";

const getBookingsInputSchema = z.object({
  userId: z
    .string()
    .optional()
    .describe(
      "Optional filter by user ID. Omit to use the signed-in user from the server session.",
    ),
  roomId: z.string().optional().describe("Filter by room ID"),
  status: z
    .enum(Object.values(BookingStatus) as [string, ...string[]])
    .optional()
    .describe("Filter by booking status"),
});

const resolveUserId = (
  params: z.infer<typeof getBookingsInputSchema>,
  resourceId?: string,
) => {
  if (params.userId) {
    return params.userId;
  }

  if (resourceId) {
    return parseAgentResourceId(resourceId).userId;
  }

  return undefined;
};

export const getBookingsTool = createTool({
  id: TOOL_KEYS.BOOKING.GET,
  description:
    "Get bookings from the backend. For personal bookings, omit userId — the signed-in user is resolved automatically from the server session. After calling, always finish with one short guest-facing chat sentence.",
  inputSchema: getBookingsInputSchema,
  outputSchema: z.object({
    bookings: z.array(bookingSchema),
  }),
  execute: async (params, context) => {
    const userId = resolveUserId(params, context.agent?.resourceId);

    if (!userId) {
      throw new Error("Authentication required to fetch bookings");
    }

    const bookings = await getBookings({
      userId,
      roomId: params.roomId,
      status: params.status as GetBookingsParams["status"],
    });

    return { bookings };
  },
});
