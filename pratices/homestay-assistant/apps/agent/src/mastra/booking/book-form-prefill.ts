import type { ProcessInputStepArgs } from "@mastra/core/processors";
import type { RequestContext } from "@mastra/core/request-context";

import { BARE_DAY_CUE, LAST_WEEKEND_CUE, MONTH_DAY_CUE, NEXT_WEEKEND_CUE, TOOL_KEYS, TOOL_PURPOSE, WEEKEND_CUE } from "@repo/constants";
import { addDaysYmd } from "@repo/utils";

import { REQUEST_CONTEXT_KEYS } from "@/mastra/middleware/constants";
import { asJsonValue, asRecord, extractMessageText, findLatestUserMessage, parseFindRoomOutput } from "@/mastra/utils";
import type { JsonValue } from "@/mastra/utils/json-value";
import { MastraDBMessage } from "@mastra/core/memory";

export type BookingFormStayHint = {
  checkInDate?: string;
  checkOutDate?: string;
  guests?: number;
};

const YMD_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const getMessageParts = (
  message: ProcessInputStepArgs["messages"][number],
): JsonValue[] | null => {
  const content = asRecord(asJsonValue(message?.content));
  const parts = content?.parts;

  return Array.isArray(parts) ? parts : null;
};

const isValidYmd = (value: unknown): value is string => {
  return typeof value === "string" && YMD_PATTERN.test(value);
};

const getContinuityStayFromPart = (
  part: JsonValue,
): BookingFormStayHint | null => {
  const record = asRecord(asJsonValue(part));

  if (record?.type !== "tool-invocation") {
    return null;
  }

  const invocation = asRecord(record.toolInvocation);

  if (
    invocation?.state !== "result" ||
    invocation.toolName !== TOOL_KEYS.GET.FIND_ROOM
  ) {
    return null;
  }

  const result = parseFindRoomOutput(invocation.result);

  if (!result || result.purpose === TOOL_PURPOSE.FIND_ROOM.BOOK_RESOLVE) {
    return null;
  }

  const checkInDate = isValidYmd(result.date) ? result.date : undefined;
  const guests = result.guests;

  if (!checkInDate && !guests) {
    return null;
  }

  return {
    ...(checkInDate
      ? {
          checkInDate,
          checkOutDate: addDaysYmd(checkInDate, 1),
        }
      : {}),
    ...(guests ? { guests } : {}),
  };
};

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

  let hint: BookingFormStayHint = {};

  for (let messageIndex = messages.length - 1; messageIndex >= 0; messageIndex -= 1) {
    const parts = getMessageParts(messages[messageIndex]);

    if (!parts) {
      continue;
    }

    for (let partIndex = parts.length - 1; partIndex >= 0; partIndex -= 1) {
      const candidate = getContinuityStayFromPart(parts[partIndex]);

      if (!candidate) {
        continue;
      }

      hint = {
        ...candidate,
        ...hint,
      };

      if (hint.checkInDate && hint.guests) {
        return hint;
      }
    }
  }

  return hint.checkInDate || hint.guests ? hint : null;
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

/**
 * Deterministic "Booking Resolver" boundary: the BOOK step machine must never
 * trust `find_room(book_resolve)`'s echoed `date`/`guests` at face value as
 * "the guest stated this" — those fields are model-filled tool args, and an
 * eager model sometimes fills them with an invented default (guests: 1,
 * date: today) despite the prompt explicitly forbidding it (see
 * intent-playbook.ts's BOOK INTENT PRIORITY ❌ example). The model stays the
 * only place that classifies intent / extracts candidate values (prompt
 * layer); this module is the only place that decides whether those values
 * are actually grounded in the guest's own words (code layer) before the
 * step machine is allowed to skip the Booking Form.
 */

const TODAY_TONIGHT_TOMORROW_CUE = /\b(today|tonight|tomorrow)\b/i;

/** Vietnamese equivalents for hôm nay / tối nay / ngày mai / cuối tuần / thứ N / chủ nhật / "ngày N". */
const VI_DATE_CUE =
  /\b(hôm\s*nay|tối\s*nay|ngày\s*mai|cuối\s*tuần|th(ứ|u)\s*[2-7]|chủ\s*nhật|ngày\s*\d{1,2})\b/i;

const WEEKDAY_CUE =
  /\b(mon|tues?|wed(?:nes)?|thur?s?|fri|sat(?:ur)?|sun)(day)?\b/i;

/**
 * Whether the guest's own latest message contains SOME recognizable check-in
 * date cue at all (word/phrase, not the resolved value — the model already
 * resolved that into `find_room.date`). Used only to corroborate that a
 * model-supplied book_resolve `date` has textual grounding, never to parse
 * the date itself.
 */
export const hasStatedCheckInCue = (text: string): boolean => {
  if (!text.trim()) return false;

  return (
    TODAY_TONIGHT_TOMORROW_CUE.test(text) ||
    VI_DATE_CUE.test(text) ||
    WEEKEND_CUE.test(text) ||
    NEXT_WEEKEND_CUE.test(text) ||
    LAST_WEEKEND_CUE.test(text) ||
    WEEKDAY_CUE.test(text) ||
    MONTH_DAY_CUE.test(text) ||
    BARE_DAY_CUE.test(text) ||
    /\d{4}-\d{2}-\d{2}/.test(text)
  );
};

/** "3 guests", "for 2 people", "2 khách", "3 người" — a party-size cue in the guest's own words. */
const GUEST_COUNT_CUE =
  /\d+\s*(?:guests?|people|persons?|pax|adults?|khách|người)\b/i;

/**
 * Whether the guest's own latest message states a party size at all. Used
 * only to corroborate a model-supplied book_resolve `guests`, never to parse
 * the count itself (the model already resolved that into `find_room.guests`).
 */
export const hasStatedGuestCue = (text: string): boolean =>
  GUEST_COUNT_CUE.test(text);

/**
 * Cross-checks the check-in date / guest count `find_room(book_resolve)`
 * echoed back against the guest's own latest message text. A value the
 * model attached without any corroborating cue in that text is treated as
 * unstated — so the BOOK step machine falls back to opening the Booking
 * Form instead of trusting an invented default.
 */
export const resolveCorroboratedBookFacts = (args: {
  messages: MastraDBMessage[] | undefined;
  statedCheckIn: string | undefined;
  statedGuests: number | undefined;
}): { checkInDate?: string; guests?: number } => {
  const { messages, statedCheckIn, statedGuests } = args;
  if (!statedCheckIn && !statedGuests) return {};

  const latestUserMessage = messages?.length
    ? findLatestUserMessage(messages)
    : undefined;
  const latestText = latestUserMessage
    ? extractMessageText(latestUserMessage)
    : "";

  return {
    ...(statedCheckIn && hasStatedCheckInCue(latestText)
      ? { checkInDate: statedCheckIn }
      : {}),
    ...(statedGuests && hasStatedGuestCue(latestText)
      ? { guests: statedGuests }
      : {}),
  };
};
