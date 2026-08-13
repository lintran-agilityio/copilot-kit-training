import type {
  ProcessInputStepArgs,
  ProcessInputStepResult,
} from "@mastra/core/processors";

import { TITLE_GENERATION_PROMPT_PATTERN, TOOL_KEYS } from "@repo/constants";
import {
  detectCancelWithoutBookingIdIntent,
  extractRoomNameQuery,
  getBusinessDates,
} from "@repo/utils";

import {
  BOOKING_STEP_DECISION_KIND,
  type BookingPrepareStepDecision,
} from "@/mastra/booking/constants";
import {
  countToolResultsInCurrentTurn,
  resolveLastToolResult,
} from "@/mastra/booking/last-tool-result";
import { narrationOnlyStep } from "@/mastra/booking/narration-only-step";
import { extractLatestUserText } from "@/mastra/booking/stated-modify-fast-path";
import { REQUEST_CONTEXT_KEYS } from "@/mastra/middleware/constants";
import {
  parseFindBookingByIdOutput,
  parseGetBookingsOutput,
} from "@/mastra/utils";

/**
 * Mastra prepareStep outcome for CANCEL without bookingId.
 * Force get_bookings first; then branch on match count so the model cannot
 * guess bookings[0] when multiple stays match.
 */
export type CancelResolveStepDecision = BookingPrepareStepDecision;

/**
 * Counts bookings on get_bookings / find_booking_by_id tool output.
 */
export const countBookingsInToolOutput = (output: unknown): number => {
  const getBookings = parseGetBookingsOutput(output);
  if (getBookings) {
    return getBookings.bookings.length;
  }

  const findById = parseFindBookingByIdOutput(output);
  if (findById) {
    return findById.bookings.length;
  }

  return 0;
};

/**
 * Extracts the sole booking id when get_bookings / find returned exactly one.
 * Prefer bookingId (find) then id (get_bookings list item).
 */
export const resolveSoleBookingIdFromToolOutput = (
  output: unknown,
): string | null => {
  const findById = parseFindBookingByIdOutput(output);
  if (findById?.bookings.length === 1) {
    const bookingId = findById.bookings[0]?.bookingId?.trim() ?? "";
    return bookingId.length > 0 ? bookingId : null;
  }

  const getBookings = parseGetBookingsOutput(output);
  if (getBookings?.bookings.length === 1) {
    const bookingId = getBookings.bookings[0]?.id?.trim() ?? "";
    return bookingId.length > 0 ? bookingId : null;
  }

  return null;
};

const pinCancelWithoutBookingId = (
  args: ProcessInputStepArgs,
  onDate: string | null,
  roomQuery: string | null,
) => {
  const requestContext = args.requestContext;
  if (!requestContext) {
    return;
  }

  requestContext.set(
    REQUEST_CONTEXT_KEYS.CANCEL_WITHOUT_BOOKING_ID_ACTIVE,
    true,
  );
  requestContext.set(
    REQUEST_CONTEXT_KEYS.CANCEL_WITHOUT_BOOKING_ID_ON_DATE,
    onDate ?? undefined,
  );
  requestContext.set(
    REQUEST_CONTEXT_KEYS.CANCEL_WITHOUT_BOOKING_ID_ROOM_QUERY,
    roomQuery && roomQuery.trim().length > 0 ? roomQuery.trim() : undefined,
  );
};

const forceTool = (toolName: string): ProcessInputStepResult => ({
  activeTools: [toolName],
  toolChoice: {
    type: "tool",
    toolName,
  },
});

/**
 * Deterministic CANCEL-without-bookingId step decision for `enforceBookingStep`.
 *
 * Sequence:
 * 1. Force `get_bookings` (optional onDate + roomQuery pins)
 * 2. Empty → narrate/stop
 * 3. One match → force `find_booking_by_id` (dialog follows via playbook / next hop)
 * 4. Multiple → force `show_cancel_dialog_confirm` with all matches (HITL list)
 */
export const resolveCancelWithoutBookingIdStep = (
  args: ProcessInputStepArgs,
): CancelResolveStepDecision => {
  const text = extractLatestUserText(args.messages);

  if (TITLE_GENERATION_PROMPT_PATTERN.test(text)) {
    return { kind: BOOKING_STEP_DECISION_KIND.NONE };
  }

  const today = getBusinessDates().today;
  const routing = detectCancelWithoutBookingIdIntent(text, today);

  if (!routing) {
    return { kind: BOOKING_STEP_DECISION_KIND.NONE };
  }

  const cancelDialogCount = countToolResultsInCurrentTurn(
    args.messages,
    TOOL_KEYS.BOOKING.SHOW_CANCEL_DIALOG_CONFIRM,
  );

  // Dialog already opened this turn — HITL / booking step machine owns the rest.
  if (cancelDialogCount >= 1) {
    return { kind: BOOKING_STEP_DECISION_KIND.NONE };
  }

  const getBookingsCount = countToolResultsInCurrentTurn(
    args.messages,
    TOOL_KEYS.BOOKING.GET,
  );
  const findByIdCount = countToolResultsInCurrentTurn(
    args.messages,
    TOOL_KEYS.BOOKING.FIND_BY_ID,
  );

  if (getBookingsCount === 0 && findByIdCount === 0) {
    const roomQuery = extractRoomNameQuery(text);
    pinCancelWithoutBookingId(
      args,
      routing.onDate,
      roomQuery.length > 0 ? roomQuery : null,
    );
    return {
      kind: BOOKING_STEP_DECISION_KIND.FORCE,
      step: forceTool(TOOL_KEYS.BOOKING.GET),
    };
  }

  const lastToolResult = resolveLastToolResult(args);

  if (lastToolResult?.toolName === TOOL_KEYS.BOOKING.GET) {
    const matchCount = countBookingsInToolOutput(lastToolResult.output);

    if (matchCount === 0) {
      return { kind: BOOKING_STEP_DECISION_KIND.NARRATE, step: narrationOnlyStep() };
    }

    if (matchCount === 1) {
      return {
        kind: BOOKING_STEP_DECISION_KIND.FORCE,
        step: forceTool(TOOL_KEYS.BOOKING.FIND_BY_ID),
      };
    }

    if (!args.tools?.[TOOL_KEYS.BOOKING.SHOW_CANCEL_DIALOG_CONFIRM]) {
      return { kind: BOOKING_STEP_DECISION_KIND.NONE };
    }

    return {
      kind: BOOKING_STEP_DECISION_KIND.FORCE,
      step: forceTool(TOOL_KEYS.BOOKING.SHOW_CANCEL_DIALOG_CONFIRM),
    };
  }

  if (lastToolResult?.toolName === TOOL_KEYS.BOOKING.FIND_BY_ID) {
    const matchCount = countBookingsInToolOutput(lastToolResult.output);

    if (matchCount === 0) {
      return { kind: BOOKING_STEP_DECISION_KIND.NARRATE, step: narrationOnlyStep() };
    }

    if (!args.tools?.[TOOL_KEYS.BOOKING.SHOW_CANCEL_DIALOG_CONFIRM]) {
      return { kind: BOOKING_STEP_DECISION_KIND.NONE };
    }

    return {
      kind: BOOKING_STEP_DECISION_KIND.FORCE,
      step: forceTool(TOOL_KEYS.BOOKING.SHOW_CANCEL_DIALOG_CONFIRM),
    };
  }

  return { kind: BOOKING_STEP_DECISION_KIND.NONE };
};
