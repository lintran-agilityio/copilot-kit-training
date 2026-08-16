import { createTool } from "@mastra/core/tools";
import { getBookingsInputSchema } from "@repo/schemas";
import { TOOL_KEYS } from "@repo/constants";
import { getBookingsOutputSchema } from "@/mastra/schemas/booking";
import {
  getBookings,
  type GetBookingsParams,
} from "@/mastra/services";
import {
  serviceContextFromTool,
  throwIfAborted,
  toGetBookingsModelOutput,
} from "@/mastra/utils";

export const getBookingsTool = createTool({
  id: TOOL_KEYS.BOOKING.GET,
  description: `
    Get the signed-in user's bookings, optionally filtered by room, date, and status. User identity always comes from the server session — never pass or invent a userId.
      - roomId (optional) scopes results to a specific room.
      - status (optional) filters by booking status.
      - onDate (YYYY-MM-DD, optional) returns bookings whose stay includes that date.
      - purpose: "list" (or omit) for a guest-facing show/list my bookings request. "resolve" when this call only resolves the target booking for cancel/modify/change-room with no bookingId — suppresses the booking-list card so the HITL that follows is the sole response.
    `,
  inputSchema: getBookingsInputSchema,
  outputSchema: getBookingsOutputSchema,
  execute: async (params, context) => {
    const { abortSignal } = context;
    throwIfAborted(abortSignal);

    const { roomId, status, onDate, purpose } = params;
    const bookings = await getBookings(
      { roomId, status: status as GetBookingsParams["status"], onDate },
      serviceContextFromTool(context),
    );

    return { bookings, purpose };
  },
  toModelOutput: toGetBookingsModelOutput,
});
