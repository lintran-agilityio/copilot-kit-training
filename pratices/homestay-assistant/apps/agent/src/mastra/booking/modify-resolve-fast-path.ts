import type {
  ProcessInputStepArgs,
  ProcessInputStepResult,
} from "@mastra/core/processors";

import { TITLE_GENERATION_PROMPT_PATTERN, TOOL_KEYS } from "@repo/constants";
import {
  detectModifyWithoutBookingIdIntent,
  extractRoomNameQuery,
  getBusinessDates,
  type ListMyBookingsDateRange,
} from "@repo/utils";

import {
  countBookingsInToolOutput,
  resolveSoleBookingIdFromToolOutput,
} from "@/mastra/booking/cancel-resolve-fast-path";
import {
  BOOKING_STEP_DECISION_KIND,
  type BookingPrepareStepDecision,
} from "@/mastra/constants";
import {
  countToolResultsInCurrentTurn,
  resolveLastToolResult,
} from "@/mastra/booking/last-tool-result";
import { narrationOnlyStep } from "@/mastra/booking/step-machine";
import { extractLatestUserText } from "@/mastra/booking/stated-modify-fast-path";
import { REQUEST_CONTEXT_KEYS } from "@/mastra/middleware/constants";

/**
 * Mastra prepareStep outcome for MODIFY without bookingId.
 * Force get_bookings first; then branch on match count so the model cannot
 * guess bookings[0] when multiple stays match.
 */
export type ModifyResolveStepDecision = BookingPrepareStepDecision;

const pinModifyWithoutBookingId = (
  args: ProcessInputStepArgs,
  onDate: string | null,
  dateRange: ListMyBookingsDateRange | null,
  roomQuery: string | null,
) => {
  const requestContext = args.requestContext;
  if (!requestContext) {
    return;
  }

  requestContext.set(
    REQUEST_CONTEXT_KEYS.MODIFY_WITHOUT_BOOKING_ID_ACTIVE,
    true,
  );
  requestContext.set(
    REQUEST_CONTEXT_KEYS.MODIFY_WITHOUT_BOOKING_ID_ON_DATE,
    onDate ?? undefined,
  );
  requestContext.set(
    REQUEST_CONTEXT_KEYS.MODIFY_WITHOUT_BOOKING_ID_DATE_FROM,
    dateRange?.from,
  );
  requestContext.set(
    REQUEST_CONTEXT_KEYS.MODIFY_WITHOUT_BOOKING_ID_DATE_TO,
    dateRange?.to,
  );
  requestContext.set(
    REQUEST_CONTEXT_KEYS.MODIFY_WITHOUT_BOOKING_ID_ROOM_QUERY,
    roomQuery && roomQuery.trim().length > 0 ? roomQuery.trim() : undefined,
  );
};

const pinPendingModifyBookingId = (
  args: ProcessInputStepArgs,
  bookingId: string,
) => {
  args.requestContext?.set(
    REQUEST_CONTEXT_KEYS.PENDING_MODIFY_BOOKING_ID,
    bookingId,
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
 * Deterministic MODIFY-without-bookingId step decision for `enforceBookingStep`.
 *
 * Sequence:
 * 1. Force `get_bookings` (optional onDate + roomQuery pins)
 * 2. Empty → narrate/stop
 * 3. One match → force `find_booking_by_id` (edit / stated-modify follows)
 * 4. Multiple → force `show_modify_dialog_select` with bookingIds only
 *    (small args; FE hydrates rows from get_bookings)
 */
export const resolveModifyWithoutBookingIdStep = (
  args: ProcessInputStepArgs,
): ModifyResolveStepDecision => {
  const text = extractLatestUserText(args.messages);

  if (TITLE_GENERATION_PROMPT_PATTERN.test(text)) {
    return { kind: BOOKING_STEP_DECISION_KIND.NONE };
  }

  const today = getBusinessDates().today;
  const routing = detectModifyWithoutBookingIdIntent(text, today);

  if (!routing) {
    return { kind: BOOKING_STEP_DECISION_KIND.NONE };
  }

  const modifyDialogCount = countToolResultsInCurrentTurn(
    args.messages,
    TOOL_KEYS.BOOKING.SHOW_MODIFY_DIALOG_SELECT,
  );

  // Picker already opened this turn — HITL / booking step machine owns the rest.
  if (modifyDialogCount >= 1) {
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
    pinModifyWithoutBookingId(
      args,
      routing.onDate,
      routing.dateRange,
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
      const soleId = resolveSoleBookingIdFromToolOutput(lastToolResult.output);
      if (soleId) {
        pinPendingModifyBookingId(args, soleId);
      }
      return {
        kind: BOOKING_STEP_DECISION_KIND.FORCE,
        step: forceTool(TOOL_KEYS.BOOKING.FIND_BY_ID),
      };
    }

    // Force picker only when the FE HITL tool is registered. Args must stay
    // tiny (bookingIds[]) — full bookings[] JSON truncates mid-stream.
    if (!args.tools?.[TOOL_KEYS.BOOKING.SHOW_MODIFY_DIALOG_SELECT]) {
      return { kind: BOOKING_STEP_DECISION_KIND.NONE };
    }

    return {
      kind: BOOKING_STEP_DECISION_KIND.FORCE,
      step: forceTool(TOOL_KEYS.BOOKING.SHOW_MODIFY_DIALOG_SELECT),
    };
  }

  // After find (single-match path): let stated-modify / model open edit form.
  return { kind: BOOKING_STEP_DECISION_KIND.NONE };
};
