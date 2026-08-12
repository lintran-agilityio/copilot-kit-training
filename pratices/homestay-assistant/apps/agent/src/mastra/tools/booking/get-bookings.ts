import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { BookingStatus } from "@repo/types";
import { getAuthUserId } from "@/mastra/middleware/get-auth-user-id";

import { TOOL_KEYS } from "@repo/constants";
import { bookingSchema } from "@/mastra/schemas/booking";
import {
  getBookings,
  type GetBookingsParams,
} from "@/mastra/services";
import {
  clearCancelWithoutBookingIdPin,
  readCancelWithoutBookingIdPin,
} from "@/mastra/utils/resolve-cancel-without-booking-id-pin";
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
      "YYYY-MM-DD — return active bookings whose stay includes this date (checkIn <= onDate < checkOut). Use for show/list my bookings with a date cue (e.g. at 15 → this month's 15th) and for cancel/modify disambiguation with a date cue.",
    ),
});

const getBookingsOutputSchema = z.object({
  bookings: z.array(bookingSchema),
  /**
   * Internal routing for toModelOutput replyHint — set when cancel-without-id
   * prepareStep forced this fetch. Not for guests.
   */
  intentHint: z.enum(["cancel_disambiguate"]).optional(),
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
 *
 * Include totalPrice so cancel HITL can map ALL matches into
 * show_cancel_dialog_confirm without inventing fields.
 */
const toGetBookingsModelOutput = (output: GetBookingsOutput) => {
  const bookingCount = output.bookings.length;
  const isCancelDisambiguate = output.intentHint === "cancel_disambiguate";

  let replyHint: string;

  if (bookingCount === 0) {
    replyHint = isCancelDisambiguate
      ? "No active bookings matched. Reply with ONE short sentence that there are none to cancel. Offer to browse/book a room. Do NOT invent bookings from chat history. Do NOT continue a prior cancel/modify workflow."
      : "No active bookings matched. Reply with ONE short sentence that there are none to view for this request. Offer to browse/book a room. Do NOT invent bookings from chat history. Do NOT offer to cancel an existing booking or imply a stay still exists. Do NOT continue a prior cancel/modify workflow.";
  } else if (isCancelDisambiguate && bookingCount === 1) {
    replyHint =
      "Exactly one active booking (count=1). CANCEL: SAME turn call find_booking_by_id with that booking id (id field), then show_cancel_dialog_confirm. Do NOT ask which. Do NOT invent other bookings.";
  } else if (isCancelDisambiguate && bookingCount > 1) {
    replyHint = `Multiple active bookings (count=${bookingCount}). CANCEL disambiguation: SAME turn call show_cancel_dialog_confirm with ALL bookings mapped as { bookingId: id, roomId, roomName, checkInDate, checkOutDate, guests, totalPrice }; queryName = the date cue or "your bookings". Do NOT pick the first. Do NOT call find_booking_by_id. Do NOT ask which in chat — the HITL list is the response (no instructional handoff).`;
  } else if (bookingCount > 1) {
    replyHint = `Active bookings only (count=${bookingCount}). This list is a COLLECTION — the sole source of truth for VIEW/LIST. Summarize or acknowledge the collection (names/dates when helpful); do NOT collapse to a single booking; do NOT ask to cancel or modify unless the latest user message explicitly asked. If the latest message is CANCEL without bookingId: SAME turn call show_cancel_dialog_confirm with ALL bookings mapped { bookingId: id, roomId, roomName, checkInDate, checkOutDate, guests, totalPrice }; queryName = date cue or "your bookings" — never guess / never find_booking_by_id on one id; HITL list is the response. Ignore create/cancel cards and older booking details in conversation history. Never present cancelled or past stays as current.`;
  } else {
    replyHint = `Active bookings only (count=${bookingCount}). This list is a COLLECTION — the sole source of truth for VIEW/LIST. Summarize or acknowledge the collection (names/dates when helpful); do NOT collapse to a single booking; do NOT ask to cancel or modify unless the latest user message explicitly asked. Ignore create/cancel cards and older booking details in conversation history. Never present cancelled or past stays as current.`;
  }

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
        totalPrice: booking.totalPrice,
        status: booking.status,
      })),
      replyHint,
    },
  };
};

export const getBookingsTool = createTool({
  id: TOOL_KEYS.BOOKING.GET,
  description:
    "Get the signed-in user's ACTIVE bookings from the backend (cancelled/past stays are excluded). User identity always comes from the server session — never pass or invent a userId. Required for view/list intent and to disambiguate cancel/modify when bookingId is unknown. Optional onDate (YYYY-MM-DD) returns only stays that include that date. Treat result.bookings + replyHint as the sole source of truth — never invent bookings from chat history or create/cancel cards. After calling: VIEW/LIST → one short chat sentence following replyHint; CANCEL with multiple matches → call show_cancel_dialog_confirm with ALL bookings (HITL list is the response — no instructional handoff); CANCEL with one match → find_booking_by_id then dialog.",
  inputSchema: getBookingsInputSchema,
  outputSchema: getBookingsOutputSchema,
  execute: async (params, context) => {
    throwIfAborted(context.abortSignal);

    const userId = getAuthUserId(
      context,
      "Authentication required to fetch bookings",
    );

    // Prefer prepareStep pins (same pattern as cancel/create stay pins).
    const listPin = readListMyBookingsPin(context.requestContext);
    const cancelPin = readCancelWithoutBookingIdPin(context.requestContext);
    clearListMyBookingsPin(context.requestContext);
    clearCancelWithoutBookingIdPin(context.requestContext);

    const roomId = listPin.active ? undefined : params.roomId;
    const onDate = listPin.active
      ? listPin.onDate
      : cancelPin.active
        ? (cancelPin.onDate ?? params.onDate)
        : params.onDate;

    const bookings = await getBookings(
      {
        userId,
        roomId,
        status: params.status as GetBookingsParams["status"],
        onDate,
      },
      serviceContextFromTool(context),
    );

    return {
      bookings,
      ...(cancelPin.active ? { intentHint: "cancel_disambiguate" as const } : {}),
    };
  },
  toModelOutput: toGetBookingsModelOutput,
});
