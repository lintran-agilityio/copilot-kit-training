import type { ProcessInputStepArgs } from "@mastra/core/processors";
import type { RequestContext } from "@mastra/core/request-context";

import { TOOL_KEYS, TOOL_PURPOSE } from "@repo/constants";
import { addDaysYmd, parseBookingFormMessageHint } from "@repo/utils";

import { REQUEST_CONTEXT_KEYS } from "@/mastra/middleware/constants";
import { asJsonValue, asRecord, parseFindRoomOutput } from "@/mastra/utils";
import {
  extractMessageText,
  findLatestUserMessage,
} from "@/mastra/utils/latest-user-message";

export type BookingFormStayHint = {
  checkInDate?: string;
  checkOutDate?: string;
  guests?: number;
};

const YMD_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Scans the full conversation (every turn, not just the current one) for the
 * most recent dated FIND/RECOMMEND `find_room` result, so a later named-room
 * BOOK resolution can prefill the Booking Form with that date instead of
 * defaulting to today. `book_resolve` lookups never carry a `date` (see
 * WORKFLOW — BOOK), so they are skipped automatically as the scan walks
 * backward past the triggering book_resolve call.
 */
export const resolveContinuityStayHint = (
  messages: ProcessInputStepArgs["messages"] | undefined,
): BookingFormStayHint | null => {
  if (!messages?.length) {
    return null;
  }

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const parts = asRecord(asJsonValue(messages[index]?.content))?.parts;
    if (!Array.isArray(parts)) {
      continue;
    }

    for (let cursor = parts.length - 1; cursor >= 0; cursor -= 1) {
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
      if (
        !parsed?.date ||
        parsed.purpose === TOOL_PURPOSE.FIND_ROOM.BOOK_RESOLVE ||
        !YMD_PATTERN.test(parsed.date)
      ) {
        continue;
      }

      return {
        checkInDate: parsed.date,
        checkOutDate: addDaysYmd(parsed.date, 1),
      };
    }
  }

  return null;
};

/**
 * Parses a date and/or guest count stated directly in the guest's latest
 * message (e.g. "Book Heritage Master Suite room at 18th for 2 guests"), so
 * a later get_room_by_id call can prefill/focus the Booking Form with them.
 * find_room's book_resolve lookup intentionally omits date/guests from its
 * own args (see WORKFLOW — BOOK), so without this they were silently
 * discarded even though the guest stated them in the same message.
 */
export const resolveCurrentMessageStayHint = (
  messages: ProcessInputStepArgs["messages"] | undefined,
  today: string,
): BookingFormStayHint | null => {
  const latestUserMessage = messages?.length
    ? findLatestUserMessage(messages)
    : undefined;

  if (!latestUserMessage) {
    return null;
  }

  const text = extractMessageText(latestUserMessage);

  if (!text) {
    return null;
  }

  const { checkInDate, guests } = parseBookingFormMessageHint(text, today);

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
