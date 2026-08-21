import type { ProcessInputStepArgs } from "@mastra/core/processors";
import type { RequestContext } from "@mastra/core/request-context";

import { TOOL_KEYS, TOOL_PURPOSE } from "@repo/constants";
import { addDaysYmd } from "@repo/utils";

import { REQUEST_CONTEXT_KEYS } from "@/mastra/middleware/constants";
import { asJsonValue, asRecord, parseFindRoomOutput } from "@/mastra/utils";

export type BookingFormStayHint = {
  checkInDate?: string;
  checkOutDate?: string;
  guests?: number;
};

const YMD_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Scans the full conversation (every turn, not just the current one) for the
 * most recent dated and/or guest-count-bearing FIND/RECOMMEND `find_room`
 * result, so a later named-room BOOK resolution can (a) prefill the Booking
 * Form with that date/guests instead of defaulting to today / asking again,
 * and (b) let the BOOK step machine skip the form entirely when the date and
 * guest count are both already known — even when they came from different
 * earlier turns. `book_resolve` lookups are skipped by this scan (the
 * triggering call's own stated date/guests are read directly from its
 * result, not via continuity).
 */
export const resolveContinuityStayHint = (
  messages: ProcessInputStepArgs["messages"] | undefined,
): BookingFormStayHint | null => {
  if (!messages?.length) {
    return null;
  }

  let checkInDate: string | undefined;
  let guests: number | undefined;

  for (
    let index = messages.length - 1;
    index >= 0 && (!checkInDate || !guests);
    index -= 1
  ) {
    const parts = asRecord(asJsonValue(messages[index]?.content))?.parts;
    if (!Array.isArray(parts)) {
      continue;
    }

    for (
      let cursor = parts.length - 1;
      cursor >= 0 && (!checkInDate || !guests);
      cursor -= 1
    ) {
      const part = asRecord(parts[cursor]);
      if (part?.type !== "tool-invocation") {
        continue;
      }

      const invocation = asRecord(part.toolInvocation);
      if (
        invocation?.state !== "result" ||
        invocation.toolName !== TOOL_KEYS.GET.FIND_ROOM
      ) {
        continue;
      }

      const parsed = parseFindRoomOutput(invocation.result);
      if (!parsed || parsed.purpose === TOOL_PURPOSE.FIND_ROOM.BOOK_RESOLVE) {
        continue;
      }

      if (!checkInDate && parsed.date && YMD_PATTERN.test(parsed.date)) {
        checkInDate = parsed.date;
      }
      if (!guests && parsed.guests) {
        guests = parsed.guests;
      }
    }
  }

  if (!checkInDate && !guests) {
    return null;
  }

  return {
    ...(checkInDate
      ? { checkInDate, checkOutDate: addDaysYmd(checkInDate, 1) }
      : {}),
    ...(guests ? { guests } : {}),
  };
};

/** Pins a resolved stay hint so the forced get_room_by_id call can read it. */
export const stashBookingFormStayHint = (
  requestContext: RequestContext | undefined,
  hint: BookingFormStayHint | null,
) => {
  if (!requestContext || !hint || (!hint.checkInDate && !hint.guests)) {
    return;
  }

  requestContext.set(
    REQUEST_CONTEXT_KEYS.PENDING_BOOKING_FORM_STAY_HINT,
    hint,
  );
};

/** Reads the pinned stay hint; malformed/missing values return null. */
export const readBookingFormStayHint = (
  requestContext: RequestContext | undefined,
): BookingFormStayHint | null => {
  const value = requestContext?.get(
    REQUEST_CONTEXT_KEYS.PENDING_BOOKING_FORM_STAY_HINT,
  );

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const hint = value as Partial<BookingFormStayHint>;
  const result: BookingFormStayHint = {};

  if (
    typeof hint.checkInDate === "string" &&
    typeof hint.checkOutDate === "string"
  ) {
    result.checkInDate = hint.checkInDate;
    result.checkOutDate = hint.checkOutDate;
  }

  if (typeof hint.guests === "number" && Number.isFinite(hint.guests)) {
    result.guests = hint.guests;
  }

  if (!result.checkInDate && !result.guests) {
    return null;
  }

  return result;
};

/** Clears the pinned hint once get_room_by_id has consumed it. */
export const clearBookingFormStayHint = (
  requestContext: RequestContext | undefined,
) => {
  requestContext?.set(
    REQUEST_CONTEXT_KEYS.PENDING_BOOKING_FORM_STAY_HINT,
    undefined,
  );
};
