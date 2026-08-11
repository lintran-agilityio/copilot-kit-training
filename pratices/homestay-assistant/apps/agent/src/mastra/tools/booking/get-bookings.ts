// Libs
import { z } from "zod";
import { createTool } from "@mastra/core/tools";
import { BookingStatus } from "@repo/types";
import { getAuthUserId } from "@/mastra/middleware/get-auth-user-id";

import { TOOL_KEYS } from "@repo/constants";
import { bookingSchema } from "@/mastra/schemas/booking";
import {
  getBookings,
  type GetBookingsParams,
} from "@/mastra/services";
import {
  clearListMyBookingsPin,
  readListMyBookingsPin,
} from "@/mastra/utils/resolve-list-my-bookings-pin";
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
  onDate: z
    .string()
    .optional()
    .describe(
      "YYYY-MM-DD — return active bookings whose stay includes this date (checkIn <= onDate < checkOut). Use for show/list my bookings with a date cue (e.g. at 15 → this month's 15th).",
    ),
});

const getBookingsOutputSchema = z.object({
  bookings: z.array(bookingSchema),
});

type GetBookingsOutput = z.infer<typeof getBookingsOutputSchema>;

/**
 * Adds a mandatory replyHint so the model cannot invent active bookings from
 * create/cancel cards still visible in conversation history.
 *
 * Slim shape: do NOT re-embed full nested `room` objects here — those already
 * live on the tool result parts MessageMerger keeps. Duplicating them in
 * providerMetadata roughly doubled each get_bookings part (~13k → ~27k) and
 * amplified the LIST self-loop that blew TokenLimiter.
 */
const toGetBookingsModelOutput = (output: GetBookingsOutput) => {
  const bookingCount = output.bookings.length;
  const replyHint =
    bookingCount === 0
      ? "No active bookings matched. Reply with ONE short sentence that there are none to view for this request. Offer to browse/book a room. Do NOT invent bookings from chat history. Do NOT offer to cancel an existing booking or imply a stay still exists. Do NOT continue a prior cancel/modify workflow."
      : `Active bookings only (count=${bookingCount}). This list is a COLLECTION — the sole source of truth for VIEW/LIST. Summarize or acknowledge the collection (names/dates when helpful); do NOT collapse to a single booking; do NOT ask to cancel or modify unless the latest user message explicitly asked. Ignore create/cancel cards and older booking details in conversation history. Never present cancelled or past stays as current.`;

  return {
    type: "json" as const,
    value: {
      bookingCount,
      bookings: output.bookings.map((booking) => ({
        id: booking.id,
        roomId: booking.roomId,
        roomName: booking.room?.name,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        guests: booking.guests,
        status: booking.status,
      })),
      replyHint,
    },
  };
};

export const getBookingsTool = createTool({
  id: TOOL_KEYS.BOOKING.GET,
  description:
    "Get the signed-in user's ACTIVE bookings from the backend (cancelled/past stays are excluded). User identity always comes from the server session — never pass or invent a userId. Required for view/list intent and to disambiguate cancel/modify when bookingId is unknown. Optional onDate (YYYY-MM-DD) returns only stays that include that date. Treat result.bookings + replyHint as the sole source of truth — never invent bookings from chat history or create/cancel cards. After calling, always finish with one short guest-facing chat sentence that follows replyHint.",
  inputSchema: getBookingsInputSchema,
  outputSchema: getBookingsOutputSchema,
  execute: async (params, context) => {
    throwIfAborted(context.abortSignal);

    const userId = getAuthUserId(
      context,
      "Authentication required to fetch bookings",
    );

    // Prefer prepareStep LIST pins (same pattern as cancel/create stay pins).
    const listPin = readListMyBookingsPin(context.requestContext);
    clearListMyBookingsPin(context.requestContext);

    const roomId = listPin.active ? undefined : params.roomId;
    const onDate = listPin.active ? listPin.onDate : params.onDate;

    const bookings = await getBookings(
      {
        userId,
        roomId,
        status: params.status as GetBookingsParams["status"],
        onDate,
      },
      serviceContextFromTool(context),
    );

    return { bookings };
  },
  toModelOutput: toGetBookingsModelOutput,
});
