import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants";
import { findBookingsInputSchema } from "@repo/schemas";
import { bookingResolutionSchema } from "@/mastra/schemas/booking";
import { findBookings } from "@/mastra/services";
import {
  buildFindBookingsReplyHint,
  serviceContextFromTool,
  throwIfAborted,
} from "@/mastra/utils";

export const findBookingsTool = createTool({
  id: TOOL_KEYS.BOOKING.FIND,
  description: `
    Resolve the signed-in user's active booking target for CANCEL/MODIFY, optionally by room name — never used for a guest-facing show/list bookings request (that's get_bookings).
    User identity always comes from the server session — never pass or invent a userId.
      - roomName is an optional case-insensitive partial match.
      - not_found means there are no matching active bookings.
      - resolved contains the only matching booking.
      - ambiguous contains every matching booking; never choose one for the guest.
    `,
  inputSchema: findBookingsInputSchema,
  outputSchema: bookingResolutionSchema,
  execute: async (params, context) => {
    throwIfAborted(context.abortSignal);
    return findBookings(params, serviceContextFromTool(context));
  },
  toModelOutput: (output) => ({
    type: "json" as const,
    value: {
      ...output,
      replyHint: buildFindBookingsReplyHint(
        output.status,
        output.status === "resolved" ? 1 : output.bookings.length,
      ),
    },
  }),
});
