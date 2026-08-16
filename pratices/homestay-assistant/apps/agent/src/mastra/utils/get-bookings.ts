import type { GetBookingsOutput } from "@/mastra/schemas/booking";
import { buildGetBookingsReplyHint } from "./generic-ui-reply-hints";

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
