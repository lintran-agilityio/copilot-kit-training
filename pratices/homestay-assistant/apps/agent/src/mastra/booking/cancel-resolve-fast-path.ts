import type {
  ProcessInputStepArgs,
  ProcessInputStepResult,
} from "@mastra/core/processors";

import { TOOL_KEYS } from "@repo/constants";
import {
  detectCancelWithoutBookingIdIntent,
  getBusinessDates,
} from "@repo/utils";

import {
  countToolResultsInCurrentTurn,
  resolveLastToolResult,
} from "@/mastra/booking/last-tool-result";
import { narrationOnlyStep } from "@/mastra/booking/narration-only-step";
import { extractLatestUserText } from "@/mastra/booking/stated-modify-fast-path";
import { REQUEST_CONTEXT_KEYS } from "@/mastra/middleware/constants";

/**
 * Mastra prepareStep outcome for CANCEL without bookingId.
 * Force get_bookings first; then branch on match count so the model cannot
 * guess bookings[0] when multiple stays match.
 */
export type CancelResolveStepDecision =
  | { kind: "force"; step: ProcessInputStepResult }
  | { kind: "narrate"; step: ProcessInputStepResult }
  | { kind: "none" };

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  if (typeof value !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
};

/**
 * Counts bookings on get_bookings / find_booking_by_id tool output.
 */
export const countBookingsInToolOutput = (output: unknown): number => {
  const record = asRecord(output);
  if (!record) {
    return 0;
  }

  if (Array.isArray(record.bookings)) {
    return record.bookings.length;
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
  const record = asRecord(output);
  const bookings = record?.bookings;

  if (!Array.isArray(bookings) || bookings.length !== 1) {
    return null;
  }

  const sole = asRecord(bookings[0]);
  if (!sole) {
    return null;
  }

  const bookingId =
    typeof sole.bookingId === "string"
      ? sole.bookingId.trim()
      : typeof sole.id === "string"
        ? sole.id.trim()
        : "";

  return bookingId.length > 0 ? bookingId : null;
};

const pinCancelWithoutBookingId = (
  args: ProcessInputStepArgs,
  onDate: string | null,
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
 * 1. Force `get_bookings` (optional onDate pin from date cue)
 * 2. Empty → narrate/stop
 * 3. One match → force `find_booking_by_id` (dialog follows via playbook / next hop)
 * 4. Multiple → force `show_cancel_dialog_confirm` with all matches (HITL list)
 */
export const resolveCancelWithoutBookingIdStep = (
  args: ProcessInputStepArgs,
): CancelResolveStepDecision => {
  const text = extractLatestUserText(args.messages);

  if (/^generate a short title for this conversation\b/i.test(text)) {
    return { kind: "none" };
  }

  const today = getBusinessDates().today;
  const routing = detectCancelWithoutBookingIdIntent(text, today);

  if (!routing) {
    return { kind: "none" };
  }

  const cancelDialogCount = countToolResultsInCurrentTurn(
    args.messages,
    TOOL_KEYS.BOOKING.SHOW_CANCEL_DIALOG_CONFIRM,
  );

  // Dialog already opened this turn — HITL / booking step machine owns the rest.
  if (cancelDialogCount >= 1) {
    return { kind: "none" };
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
    pinCancelWithoutBookingId(args, routing.onDate);
    return {
      kind: "force",
      step: forceTool(TOOL_KEYS.BOOKING.GET),
    };
  }

  const lastToolResult = resolveLastToolResult(args);

  if (lastToolResult?.toolName === TOOL_KEYS.BOOKING.GET) {
    const matchCount = countBookingsInToolOutput(lastToolResult.output);

    if (matchCount === 0) {
      return { kind: "narrate", step: narrationOnlyStep() };
    }

    if (matchCount === 1) {
      return {
        kind: "force",
        step: forceTool(TOOL_KEYS.BOOKING.FIND_BY_ID),
      };
    }

    return {
      kind: "force",
      step: forceTool(TOOL_KEYS.BOOKING.SHOW_CANCEL_DIALOG_CONFIRM),
    };
  }

  if (lastToolResult?.toolName === TOOL_KEYS.BOOKING.FIND_BY_ID) {
    const matchCount = countBookingsInToolOutput(lastToolResult.output);

    if (matchCount === 0) {
      return { kind: "narrate", step: narrationOnlyStep() };
    }

    return {
      kind: "force",
      step: forceTool(TOOL_KEYS.BOOKING.SHOW_CANCEL_DIALOG_CONFIRM),
    };
  }

  return { kind: "none" };
};
