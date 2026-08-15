import type { ProcessInputStepArgs } from "@mastra/core/processors";

import { TITLE_GENERATION_PROMPT_PATTERN, TOOL_KEYS } from "@repo/constants";
import {
  detectListMyBookingsIntent,
  getBusinessDates,
  type ListMyBookingsDateRange,
} from "@repo/utils";

import {
  BOOKING_STEP_DECISION_KIND,
  type BookingPrepareStepDecision,
} from "@/mastra/constants";
import {
  countToolResultsInCurrentTurn,
  resolveLastToolResult,
} from "@/mastra/booking/last-tool-result";
import { narrationOnlyStep } from "@/mastra/booking/step-machine";
import { REQUEST_CONTEXT_KEYS } from "@/mastra/middleware/constants";
import { extractLatestUserText } from "@/mastra/booking/stated-modify-fast-path";

/**
 * Mastra prepareStep outcome for VIEW / LIST_MY_BOOKINGS.
 * Mirrors stated-modify-fast-path: force a server tool only when required;
 * after a successful list fetch, lock tools for a narration-only hop.
 */
export type ListMyBookingsStepDecision = BookingPrepareStepDecision;

/**
 * Clears mutation pins so a fresh LIST_MY_BOOKINGS turn cannot inherit
 * pending cancel/modify booking ids from an earlier workflow.
 * Mastra requestContext only — does not touch CopilotKit UI / AG-UI transcript.
 */
const clearStaleMutationPins = (args: ProcessInputStepArgs) => {
  const requestContext = args.requestContext;
  if (!requestContext) {
    return;
  }

  requestContext.set(REQUEST_CONTEXT_KEYS.PENDING_CANCEL_BOOKING_ID, undefined);
  requestContext.set(REQUEST_CONTEXT_KEYS.PENDING_MODIFY_BOOKING_ID, undefined);
  requestContext.set(REQUEST_CONTEXT_KEYS.PENDING_MODIFY_CANDIDATE, undefined);
  requestContext.set(REQUEST_CONTEXT_KEYS.PENDING_MODIFY_ORIGINAL, undefined);
  requestContext.set(REQUEST_CONTEXT_KEYS.PENDING_UPDATE_STAY, undefined);
};

const pinListMyBookings = (
  args: ProcessInputStepArgs,
  onDate: string | null,
  dateRange: ListMyBookingsDateRange | null,
) => {
  const requestContext = args.requestContext;
  if (!requestContext) {
    return;
  }

  clearStaleMutationPins(args);
  requestContext.set(REQUEST_CONTEXT_KEYS.LIST_MY_BOOKINGS_ACTIVE, true);
  requestContext.set(
    REQUEST_CONTEXT_KEYS.LIST_MY_BOOKINGS_ON_DATE,
    onDate ?? undefined,
  );
  requestContext.set(
    REQUEST_CONTEXT_KEYS.LIST_MY_BOOKINGS_DATE_FROM,
    dateRange?.from,
  );
  requestContext.set(
    REQUEST_CONTEXT_KEYS.LIST_MY_BOOKINGS_DATE_TO,
    dateRange?.to,
  );
};

/**
 * Deterministic LIST_MY_BOOKINGS step decision for `enforceBookingStep`.
 *
 * After the forced get_bookings hop, returns `narrate` with toolChoice "none"
 * so the model cannot re-call get_bookings. Detection uses steps AND current-turn
 * message parts — StepResult.toolResults alone was missing/late in production,
 * which re-forced get_bookings every step until TokenLimiter tripped.
 */
export const resolveListMyBookingsStep = (
  args: ProcessInputStepArgs,
): ListMyBookingsStepDecision => {
  const text = extractLatestUserText(args.messages);

  // Intelligence title-gen embeds the guest line ("…user: Show my bookings.")
  // — must not force get_bookings on that hidden run (proven TokenLimiter loop).
  if (TITLE_GENERATION_PROMPT_PATTERN.test(text)) {
    return { kind: BOOKING_STEP_DECISION_KIND.NONE };
  }

  const today = getBusinessDates().today;
  const routing = detectListMyBookingsIntent(text, today);

  if (!routing) {
    return { kind: BOOKING_STEP_DECISION_KIND.NONE };
  }

  const getBookingsCount = countToolResultsInCurrentTurn(
    args.messages,
    TOOL_KEYS.BOOKING.GET,
  );

  // Already fetched this turn (possibly multiple times before the lock) —
  // guest-facing reply only. Message-part count is authoritative because
  // MessageMerger records each invocation even when steps[].toolResults is empty.
  if (getBookingsCount >= 1) {
    return { kind: BOOKING_STEP_DECISION_KIND.NARRATE, step: narrationOnlyStep() };
  }

  const lastToolResult = resolveLastToolResult(args);

  // Mid-turn after a different tool on an explicit list message — do not force
  // another get_bookings, and do not leave list tools open for a self-loop.
  if (lastToolResult?.toolName) {
    return { kind: BOOKING_STEP_DECISION_KIND.NARRATE, step: narrationOnlyStep() };
  }

  pinListMyBookings(args, routing.onDate, routing.dateRange);

  return {
    kind: BOOKING_STEP_DECISION_KIND.FORCE,
    step: {
      activeTools: [TOOL_KEYS.BOOKING.GET],
      toolChoice: {
        type: "tool",
        toolName: TOOL_KEYS.BOOKING.GET,
      },
    },
  };
};
