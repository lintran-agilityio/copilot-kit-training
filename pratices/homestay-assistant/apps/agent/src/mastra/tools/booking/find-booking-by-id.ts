import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import { TOOL_PURPOSE } from "@repo/constants";
import { isAbortError, sanitizeBookingId } from "@repo/utils";
import {
  findBookingByIdInputSchema,
  findBookingByIdOutputSchema,
  type FindBookingAvailability,
  type FindBookingByIdOutput,
} from "@/mastra/schemas/booking";
import { REQUEST_CONTEXT_KEYS } from "@/mastra/middleware/constants";
import { checkRoomAvailability, findBookingById } from "@/mastra/services";
import { isSameModifyStay } from "@/mastra/utils/modify-booking";
import {
  takePinnedBookingId,
  takePinnedModifyRequestedFields,
} from "@/mastra/utils/resolve-pinned-stay";
import {
  serviceContextFromTool,
  throwIfAborted,
} from "@/mastra/utils/abort";

type ModifyStayInput = {
  requestedCheckInDate?: string;
  requestedCheckOutDate?: string;
  requestedGuests?: number;
};

/**
 * Hard reply hint when the MODIFY stated-change availability probe came back
 * unavailable — mirrors `toFindRoomModelOutput`'s BookingUnavailable branch.
 * FindBookingByIdNotice renders the card from the raw result, so the model
 * gets no dates/guests/room facts to leak into chat.
 */
const MODIFY_UNAVAILABLE_REPLY_HINT =
  'BookingUnavailable Generic UI is already rendered and the turn is stopping. Reply with exactly ONE very short sentence in the guest\'s language offering to help with other dates or a larger room. Do NOT repeat the room name, reason, capacity, dates, guests, or any availability value — the card shows them. English example: "I can help you pick other dates or find a larger room."';

/** Hard reply hint when the merged stated change equals the current stay. */
const MODIFY_UNCHANGED_REPLY_HINT =
  "The booking already has those exact dates and guests — no change is needed and the turn is stopping. Reply with exactly ONE short sentence in the guest's language that the booking already has those details. Do NOT open any confirmation, do NOT suggest other edits, and do NOT ask what else to change.";

/** Companion hint when the stated change is free — the app opens the modify confirmation next. */
const MODIFY_AVAILABLE_REPLY_HINT =
  "The app is opening the modify confirmation card (old → new + new total) now. Reply with exactly ONE short review sentence in the guest's language, such as \"Please review and confirm the changes.\" Never restate the room, dates, guests, or total.";

/**
 * MODIFY stated-change path: probe `/bookings/availability` for the merged stay
 * (booking's current stay + whichever requested* fields resolved), excluding
 * this booking from overlap detection, so the flow never needs a separate
 * `check_room_availability` tool call. A no-op merge skips the probe and is
 * reported via `stayUnchanged`. A failed probe returns `undefined` — the step
 * machine still forces `confirm_modify_booking` and `update_booking` is the
 * authoritative gate.
 */
const probeModifyAvailability = async (
  result: FindBookingByIdOutput,
  bookingId: string,
  stated: ModifyStayInput,
  context: Parameters<typeof serviceContextFromTool>[0],
): Promise<{ availability?: FindBookingAvailability; stayUnchanged?: true }> => {
  const booking = result.bookings[0];
  const roomId = result.room?.id ?? booking?.roomId;

  const hasStatedChange =
    Boolean(stated.requestedCheckInDate) ||
    Boolean(stated.requestedCheckOutDate) ||
    stated.requestedGuests !== undefined;

  if (!booking || !roomId || !hasStatedChange) {
    return {};
  }

  const current = {
    checkInDate: booking.checkInDate,
    checkOutDate: booking.checkOutDate,
    guests: booking.guests,
  };
  const merged = {
    checkInDate: stated.requestedCheckInDate ?? current.checkInDate,
    checkOutDate: stated.requestedCheckOutDate ?? current.checkOutDate,
    guests: stated.requestedGuests ?? current.guests,
  };

  if (isSameModifyStay(current, merged)) {
    return { stayUnchanged: true };
  }

  try {
    const probe = await checkRoomAvailability(
      {
        roomId,
        checkInDate: merged.checkInDate,
        checkOutDate: merged.checkOutDate,
        guests: merged.guests,
        excludeBookingId: bookingId,
      },
      serviceContextFromTool(context),
    );

    return {
      availability: {
        available: probe.available,
        guestsWithinCapacity: probe.guestsWithinCapacity,
        checkInDate: merged.checkInDate,
        checkOutDate: merged.checkOutDate,
        guests: merged.guests,
      },
    };
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    return {};
  }
};

/**
 * Shapes what the LLM sees. The FE renderer (FindBookingByIdNotice) always gets
 * the RAW execute output — this only steers the model's one companion sentence
 * for the MODIFY stated-change outcomes. CANCEL and the edit-form MODIFY path
 * fall through unchanged.
 */
export const toFindBookingByIdModelOutput = (output: FindBookingByIdOutput) => {
  // stayUnchanged / unavailable: the turn is stopping. Slim payload (no
  // bookings/dates/guests to restate) + a hard replyHint, mirroring
  // toFindRoomModelOutput's BookingUnavailable branch. NOT `bookings: []` —
  // that means "no such booking" (not_modifiable / lookup_failed), a different
  // reply.
  if (output.stayUnchanged) {
    return {
      type: "json" as const,
      value: { modifyOutcome: "unchanged", replyHint: MODIFY_UNCHANGED_REPLY_HINT },
    };
  }

  const probe = output.availability;
  if (probe && (probe.available === false || probe.guestsWithinCapacity === false)) {
    return {
      type: "json" as const,
      value: {
        modifyOutcome: "unavailable",
        available: probe.available,
        guestsWithinCapacity: probe.guestsWithinCapacity,
        replyHint: MODIFY_UNAVAILABLE_REPLY_HINT,
      },
    };
  }

  if (probe) {
    return {
      type: "json" as const,
      value: { ...output, replyHint: MODIFY_AVAILABLE_REPLY_HINT },
    };
  }

  return { type: "json" as const, value: output };
};

export const findBookingByIdTool = createTool({
  id: TOOL_KEYS.BOOKING.FIND_BY_ID,
  description: `
    Look up one specific active booking by its ID, for a CANCEL or MODIFY action.
      - Use only when a bookingId is already known — a bookingId: value in the message (including [booking-cancel] / [booking-modify] from BookingCard clicks), or a booking id chosen via a prior find_bookings result. If you only have a room name (no id), call find_bookings instead. For a guest-facing "show/list my bookings" request, call get_bookings instead — never this tool.
      - purpose selects CANCEL vs MODIFY eligibility rules; see the purpose parameter.
      - For MODIFY, also set requestedCheckInDate / requestedCheckOutDate / requestedGuests when the guest's LATEST message states a new value for that field. When any is set, this tool probes availability for the merged stay itself (excluding this booking) — the app then forces confirm_modify_booking (available), stops with a BookingUnavailable card (taken / over capacity), or stops with an "already has those details" reply (no-op). Never call check_room_availability for MODIFY.
    `,
  inputSchema: findBookingByIdInputSchema,
  outputSchema: findBookingByIdOutputSchema,
  execute: async (
    { bookingId, purpose, requestedCheckInDate, requestedCheckOutDate, requestedGuests },
    context,
  ) => {
    throwIfAborted(context.abortSignal);

    // Prefer the id pinned by prepareStep from the modify picker / sole match.
    // Both pins below are MODIFY-only — never set for a CANCEL call — but the
    // purpose check makes that a structural guarantee, not just a coincidence
    // of what step-machine happens to set today.
    const isModify = purpose === TOOL_PURPOSE.FIND_BOOKING_BY_ID.MODIFY;
    const pinnedBookingId = isModify
      ? takePinnedBookingId(context.requestContext, REQUEST_CONTEXT_KEYS.PENDING_MODIFY_BOOKING_ID)
      : null;
    // Same idea for the requested-change fields: a picker pick's forced
    // follow-up call shouldn't have to re-derive what the guest already
    // stated before the picker opened — fall back to what was pinned then.
    const pinnedRequestedFields = isModify
      ? takePinnedModifyRequestedFields(context.requestContext, REQUEST_CONTEXT_KEYS.PENDING_MODIFY_REQUESTED_FIELDS)
      : null;

    const id = sanitizeBookingId(pinnedBookingId ?? bookingId);
    const resolvedCheckInDate = isModify ? requestedCheckInDate ?? pinnedRequestedFields?.checkInDate : undefined;
    const resolvedCheckOutDate = isModify ? requestedCheckOutDate ?? pinnedRequestedFields?.checkOutDate : undefined;
    const resolvedGuests = isModify ? requestedGuests ?? pinnedRequestedFields?.guests : undefined;

    const result = await findBookingById(id, serviceContextFromTool(context), purpose);

    const echoed = {
      ...result,
      ...(resolvedCheckInDate ? { requestedCheckInDate: resolvedCheckInDate } : {}),
      ...(resolvedCheckOutDate ? { requestedCheckOutDate: resolvedCheckOutDate } : {}),
      ...(resolvedGuests !== undefined ? { requestedGuests: resolvedGuests } : {}),
    };

    if (!isModify || result.bookings.length !== 1) {
      return echoed;
    }

    const { availability, stayUnchanged } = await probeModifyAvailability(
      echoed,
      id,
      {
        requestedCheckInDate: resolvedCheckInDate,
        requestedCheckOutDate: resolvedCheckOutDate,
        requestedGuests: resolvedGuests,
      },
      context,
    );

    return {
      ...echoed,
      ...(availability ? { availability } : {}),
      ...(stayUnchanged ? { stayUnchanged: true as const } : {}),
    };
  },
  toModelOutput: toFindBookingByIdModelOutput,
});
