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
import {
  serviceContextFromTool,
  throwIfAborted,
} from "@/mastra/utils/abort";

const getBookingsInputSchema = z.object({
  roomId: z.string().optional().describe("Filter by room ID"),
  status: z
    .enum(Object.values(BookingStatus) as [string, ...string[]])
    .optional()
    .describe("Filter by booking status"),
});

const getBookingsOutputSchema = z.object({
  bookings: z.array(bookingSchema),
});

type GetBookingsOutput = z.infer<typeof getBookingsOutputSchema>;

/**
 * Adds a mandatory replyHint so the model cannot invent active bookings from
 * create/cancel cards still visible in conversation history.
 */
const toGetBookingsModelOutput = (output: GetBookingsOutput) => {
  const bookingCount = output.bookings.length;
  const replyHint =
    bookingCount === 0
      ? "No active bookings. Reply with ONE short sentence that there are none to view, modify, cancel, or change rooms for. Offer to browse/book a room. Do NOT invent bookings from chat history. Do NOT offer to cancel an existing booking or imply a stay still exists."
      : `Active bookings only (count=${bookingCount}). This list is the sole source of truth — ignore create/cancel cards and older booking details in conversation history. Obey TOOL RESULTS / WORKFLOW for view vs modify/cancel/change-room. Never present cancelled or past stays as current.`;

  return {
    type: "json" as const,
    value: {
      bookingCount,
      bookings: output.bookings,
      replyHint,
    },
  };
};

export const getBookingsTool = createTool({
  id: TOOL_KEYS.BOOKING.GET,
  description:
    "Get the signed-in user's ACTIVE bookings from the backend (cancelled/past stays are excluded). User identity always comes from the server session — never pass or invent a userId. Required for view intent and to disambiguate cancel/modify when bookingId is unknown. Treat result.bookings + replyHint as the sole source of truth — never invent bookings from chat history or create/cancel cards. After calling, always finish with one short guest-facing chat sentence that follows replyHint.",
  inputSchema: getBookingsInputSchema,
  outputSchema: getBookingsOutputSchema,
  execute: async (params, context) => {
    throwIfAborted(context.abortSignal);

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
      serviceContextFromTool(context),
    );

    return { bookings };
  },
  toModelOutput: toGetBookingsModelOutput,
});
