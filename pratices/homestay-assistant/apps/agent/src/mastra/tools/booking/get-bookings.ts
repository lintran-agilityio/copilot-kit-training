import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants";
import { getBookingsInputSchema } from "@repo/schemas";
import { GetBookingsOutput, getBookingsOutputSchema } from "@/mastra/schemas/booking";
import { getBookings, type GetBookingsParams } from "@/mastra/services";
import {
  buildGetBookingsReplyHint,
  serviceContextFromTool,
  throwIfAborted,
} from "@/mastra/utils";

/**
 * Adds bookingCount/purpose/replyHint alongside the raw bookings so the
 * prompt can enforce list-vs-resolve behavior structurally (see
 * stop-after-list-results.ts, which reads bookingCount off this shape).
 * Unlike find_room's slim output, bookings stay in full here — the model
 * needs id/roomId/dates/guests/totalPrice to build multi-match HITL picker args.
 */
export const toGetBookingsModelOutput = (output: GetBookingsOutput) => {
  const bookingCount = output.bookings.length;

  return {
    type: "json" as const,
    value: {
      bookingCount,
      purpose: output.purpose,
      replyHint: buildGetBookingsReplyHint(bookingCount, output.purpose),
      bookings: output.bookings,
    },
  };
};

export const getBookingsTool = createTool({
  id: TOOL_KEYS.BOOKING.GET,
  description: `
    Get the signed-in user's bookings for a guest-facing show/list my bookings request, optionally filtered by room, date, and status. User identity always comes from the server session — never pass or invent a userId.
      - roomId / roomName (optional) scope results to a specific room; see the roomName parameter.
      - status (optional) filters by booking status.
      - onDate (optional) returns bookings whose stay includes that date; see the onDate parameter.
      - purpose selects list vs resolve behavior; see the purpose parameter.
    `,
  inputSchema: getBookingsInputSchema,
  outputSchema: getBookingsOutputSchema,
  execute: async (params, context) => {
    const { abortSignal } = context;
    throwIfAborted(abortSignal);

    const { roomId, roomName, status, onDate, purpose } = params;
    const bookings = await getBookings(
      {
        roomId,
        roomName,
        status: status as GetBookingsParams["status"],
        onDate,
      },
      serviceContextFromTool(context),
    );

    return { bookings, purpose };
  },
  toModelOutput: toGetBookingsModelOutput,
});
