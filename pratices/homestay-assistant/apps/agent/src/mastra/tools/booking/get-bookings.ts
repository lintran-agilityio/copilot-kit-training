import { createTool } from "@mastra/core/tools";
import { getBookingsInputSchema } from "@repo/schemas";
import { matchesRoomName } from "@repo/utils";
import { TOOL_KEYS } from "@repo/constants";
import {
  getBookingsOutputSchema,
  type GetBookingsOutput,
} from "@/mastra/schemas/booking";
import {
  getBookings,
  type GetBookingsParams,
} from "@/mastra/services";
import {
  clearCancelWithoutBookingIdPin,
  readCancelWithoutBookingIdPin,
  clearListMyBookingsPin,
  readListMyBookingsPin,
  clearModifyWithoutBookingIdPin,
  readModifyWithoutBookingIdPin,
  serviceContextFromTool,
  throwIfAborted,
} from "@/mastra/utils";

/**
 * Adds a mandatory replyHint so the model cannot invent active bookings from
 * create/cancel cards still visible in conversation history.
 *
 * Slim shape: do NOT re-embed full nested `room` objects here — those already
 * live on the tool result parts MessageMerger keeps.
 *
 * Include totalPrice so cancel HITL / FE hydrate can map matches without
 * inventing fields. Modify multi HITL prefers bookingIds only (tiny args).
 */
const toGetBookingsModelOutput = (output: GetBookingsOutput) => {
  const { bookings } = output;
  const bookingCount = bookings.length;

  const isCancelDisambiguate = output.intentHint === "cancel_disambiguate";
  const isModifyDisambiguate = output.intentHint === "modify_disambiguate";

  const bookingIds = bookings.map(({ id }) => id);

  const modelBookings = bookings.map((booking) => ({
    id: booking.id,
    roomId: booking.roomId,
    roomName: booking.room?.name,
    checkInDate: booking.checkInDate,
    checkOutDate: booking.checkOutDate,
    guests: booking.guests,
    totalPrice: booking.totalPrice,
    status: booking.status,
  }));

  const getEmptyReplyHint = () => {
    if (isCancelDisambiguate) {
      return (
        "No active bookings matched. " +
        "Reply with ONE short sentence that there are none to cancel. " +
        "Offer to browse/book a room. " +
        "Do NOT invent bookings from chat history. " +
        "Do NOT continue a prior cancel/modify workflow."
      );
    }

    if (isModifyDisambiguate) {
      return (
        "No active bookings matched. " +
        "Reply with ONE short sentence that there are none to modify. " +
        "Offer to browse/book a room. " +
        "Do NOT invent bookings from chat history. " +
        "Do NOT continue a prior cancel/modify workflow."
      );
    }

    return (
      "No active bookings matched. " +
      "Reply with ONE short sentence that there are none to view for this request. " +
      "Offer to browse/book a room. " +
      "Do NOT invent bookings from chat history. " +
      "Do NOT offer to cancel an existing booking or imply a stay still exists. " +
      "Do NOT continue a prior cancel/modify workflow."
    );
  };

  const getCancelReplyHint = () => {
    if (bookingCount === 1) {
      return (
        "Exactly one active booking (count=1). " +
        "CANCEL: SAME turn call find_booking_by_id with that booking id (id field), " +
        "then show_cancel_dialog_confirm. " +
        "Do NOT ask which. Do NOT invent other bookings."
      );
    }

    return (
      `Multiple active bookings (count=${bookingCount}). ` +
      'CANCEL disambiguation: SAME turn call show_cancel_dialog_confirm with ALL bookings ' +
      'mapped as { bookingId: id, roomId, roomName, checkInDate, checkOutDate, guests, totalPrice }; ' +
      'queryName = the date cue or "your bookings". ' +
      "Do NOT pick the first. " +
      "Do NOT call find_booking_by_id. " +
      "Do NOT ask which in chat — the HITL list is the response (no instructional handoff)."
    );
  };

  const getModifyReplyHint = () => {
    if (bookingCount === 1) {
      return (
        "Exactly one active booking (count=1). " +
        "MODIFY: SAME turn call find_booking_by_id with that booking id (id field), " +
        "then continue edit_modify_booking or stated-change availability. " +
        "Do NOT ask which. Do NOT invent other bookings."
      );
    }

    return (
      `Multiple active bookings (count=${bookingCount}). ` +
      "MODIFY disambiguation: SAME turn call show_modify_dialog_select with ONLY " +
      `{ bookingIds: ${JSON.stringify(bookingIds)}, queryName: room name or "your bookings" }. ` +
      "Do NOT send full bookings[] rows (args truncate). " +
      "Do NOT pick the first. " +
      "Do NOT call find_booking_by_id yet. " +
      "Do NOT ask which in chat — the HITL list is the response (no instructional handoff)."
    );
  };

  const getCollectionReplyHint = () => {
    const base =
      `Active bookings only (count=${bookingCount}). ` +
      "This list is a COLLECTION — the sole source of truth for VIEW/LIST. " +
      "Results render as booking cards in chat automatically — do NOT restate room names, dates, prices, or a list in text; " +
      "reply with ONE short acknowledgement sentence instead; " +
      "do NOT collapse to a single booking; " +
      "do NOT ask to cancel or modify unless the latest user message explicitly asked. ";

    if (bookingCount === 1) {
      return (
        base +
        "Ignore create/cancel cards and older booking details in conversation history. " +
        "Never present cancelled or past stays as current."
      );
    }

    return (
      base +
      'If the latest message is CANCEL without bookingId: SAME turn call ' +
      'show_cancel_dialog_confirm with ALL bookings mapped ' +
      "{ bookingId: id, roomId, roomName, checkInDate, checkOutDate, guests, totalPrice }; " +
      'queryName = date cue or "your bookings" — never guess / never find_booking_by_id on one id; ' +
      "HITL list is the response. " +
      "If the latest message is MODIFY without bookingId: SAME turn call " +
      'show_modify_dialog_select with { bookingIds: all ids, queryName } only — ' +
      "never full bookings[] rows; never guess; HITL list is the response. " +
      "Ignore create/cancel cards and older booking details in conversation history. " +
      "Never present cancelled or past stays as current."
    );
  };

  const replyHint = (() => {
    if (bookingCount === 0) {
      return getEmptyReplyHint();
    }

    if (isCancelDisambiguate) {
      return getCancelReplyHint();
    }

    if (isModifyDisambiguate) {
      return getModifyReplyHint();
    }

    return getCollectionReplyHint();
  })();

  return {
    type: "json" as const,
    value: {
      bookingCount,
      bookings: modelBookings,
      replyHint,
    },
  };
};

export const getBookingsTool = createTool({
  id: TOOL_KEYS.BOOKING.GET,
  description:
    "Get the signed-in user's ACTIVE bookings from the backend (cancelled/past stays are excluded). User identity always comes from the server session — never pass or invent a userId. Required for view/list intent and to disambiguate cancel/modify when bookingId is unknown. Optional onDate (YYYY-MM-DD) returns only stays that include that date. Treat result.bookings + replyHint as the sole source of truth — never invent bookings from chat history or create/cancel cards. For VIEW/LIST, results render as booking cards in chat automatically — do NOT write booking names, dates, prices, or a list in text. After calling: VIEW/LIST → one short chat sentence following replyHint; CANCEL with multiple matches → call show_cancel_dialog_confirm with ALL bookings (HITL list is the response — no instructional handoff); CANCEL with one match → find_booking_by_id then dialog; MODIFY with multiple matches → call show_modify_dialog_select with bookingIds[] + queryName only (not full bookings rows); MODIFY with one match → find_booking_by_id then edit/stated-modify.",
  inputSchema: getBookingsInputSchema,
  outputSchema: getBookingsOutputSchema,
  execute: async (params, context) => {
    const { requestContext, abortSignal } = context;
    throwIfAborted(abortSignal);
    const { onDate: onDateParam } = params;

    // Prefer prepareStep pins (same pattern as cancel/create stay pins).
    const listPin = readListMyBookingsPin(requestContext);
    const cancelPin = readCancelWithoutBookingIdPin(requestContext);
    const modifyPin = readModifyWithoutBookingIdPin(requestContext);
    clearListMyBookingsPin(requestContext);
    clearCancelWithoutBookingIdPin(requestContext);
    clearModifyWithoutBookingIdPin(requestContext);

    const roomId = listPin.active ? undefined : params.roomId;
    const onDate = listPin.active
      ? listPin.onDate
      : cancelPin.active
        ? (cancelPin.onDate ?? onDateParam)
        : modifyPin.active
          ? (modifyPin.onDate ?? onDateParam)
          : onDateParam;

    let bookings = await getBookings(
      {
        roomId,
        status: params.status as GetBookingsParams["status"],
        onDate,
      },
      serviceContextFromTool(context),
    );

    // Modify-without-id: when the guest named a room, keep only matching stays
    // so the picker JSON stays small and same-room multi-date cases disambiguate.
    if (modifyPin.active && modifyPin.roomQuery) {
      const filtered = bookings.filter((booking) =>
        matchesRoomName(booking.room?.name ?? "", modifyPin.roomQuery!),
      );
      if (filtered.length > 0) {
        bookings = filtered;
      }
    }

    return {
      bookings,
      ...(cancelPin.active
        ? { intentHint: "cancel_disambiguate" as const }
        : modifyPin.active
          ? { intentHint: "modify_disambiguate" as const }
          : {}),
    };
  },
  toModelOutput: toGetBookingsModelOutput,
});
