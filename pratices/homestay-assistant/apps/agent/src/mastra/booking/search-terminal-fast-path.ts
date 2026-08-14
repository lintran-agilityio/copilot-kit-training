import type {
  ProcessInputStepArgs,
  ProcessInputStepResult,
} from "@mastra/core/processors";

import { TOOL_KEYS } from "@repo/constants";

import {
  resolveContinuityStayHint,
  stashBookingFormStayHint,
} from "@/mastra/booking/book-form-prefill";
import { resolveLastToolResult } from "@/mastra/booking/last-tool-result";
import { narrationOnlyStep } from "@/mastra/booking/narration-only-step";
import { parseFindRoomOutput } from "@/mastra/utils";
import type { FindRoomPurpose } from "@repo/schemas";

/**
 * Large list/search tools that must not re-run after a terminal search/browse hop.
 * Intentionally omits check/confirm/mutate tools so BOOK/MODIFY can continue.
 */
const SEARCH_LOOP_TOOLS = new Set<string>([
  TOOL_KEYS.GET.FIND_ROOM,
  TOOL_KEYS.GET.ROOMS,
  TOOL_KEYS.BOOKING.GET,
]);

/**
 * After a successful search/browse tool, expose every registered tool except the
 * list/search tools that just completed — so `update_room_list` / HITL / availability
 * can still run, but the model cannot re-fetch the same large catalog payload.
 */
const excludeSearchLoopTools = (
  args: ProcessInputStepArgs,
): ProcessInputStepResult => {
  const names = Object.keys(args.tools ?? {}).filter(
    (name) => !SEARCH_LOOP_TOOLS.has(name),
  );

  return {
    activeTools: names,
  };
};

/**
 * Deterministically forces `get_room_by_id` so a named-room free-text book request
 * always opens the Booking Form for the guest to pick check-in/check-out/guests,
 * instead of letting the model invent unstated dates/guests and jump straight to
 * `check_room_availability` / `confirm_booking`. `[book-stay]` submissions from that
 * same form bypass `find_room`/book_resolve entirely, so they are unaffected.
 */
const forceGetRoomById = (
  args: ProcessInputStepArgs,
): ProcessInputStepResult | undefined => {
  if (!args.tools?.[TOOL_KEYS.BOOKING.GET_ROOM_BY_ID]) {
    return undefined;
  }

  // Pin any already-established search date so the Booking Form prefills it
  // instead of defaulting to today — the tool call itself is still forced
  // regardless of whether a hint is found.
  stashBookingFormStayHint(
    args.requestContext,
    resolveContinuityStayHint(args.messages),
  );

  return {
    activeTools: [TOOL_KEYS.BOOKING.GET_ROOM_BY_ID],
    toolChoice: {
      type: "tool",
      toolName: TOOL_KEYS.BOOKING.GET_ROOM_BY_ID,
    },
  };
};

const readFindRoomPurpose = (
  output: unknown,
): FindRoomPurpose | undefined => {
  return parseFindRoomOutput(output)?.purpose;
};

const readFindRoomMatchCount = (output: unknown): number => {
  const parsed = parseFindRoomOutput(output);
  return parsed?.rooms.length ?? 0;
};

/**
 * Terminal / post-search prepareStep decisions for FIND / BROWSE.
 *
 * - search / recommend / multi-match book_resolve / empty book_resolve → narration only
 * - book_resolve + exactly one match → force get_room_by_id (Booking Form), never a
 *   direct hop to check_room_availability/confirm_booking with guessed dates/guests
 * - get_rooms → allow update_room_list / HITL, block re-get_rooms / find_room / get_bookings
 */
export const tryEnforceSearchTerminalStep = (
  args: ProcessInputStepArgs,
): ProcessInputStepResult | undefined => {
  const lastToolResult = resolveLastToolResult(args);
  if (!lastToolResult?.toolName) {
    return undefined;
  }

  if (lastToolResult.toolName === TOOL_KEYS.GET.FIND_ROOM) {
    const purpose = readFindRoomPurpose(lastToolResult.output);
    const matchCount = readFindRoomMatchCount(lastToolResult.output);

    if (purpose === "book_resolve" && matchCount === 1) {
      return forceGetRoomById(args) ?? excludeSearchLoopTools(args);
    }

    return narrationOnlyStep();
  }

  if (lastToolResult.toolName === TOOL_KEYS.GET.ROOMS) {
    return excludeSearchLoopTools(args);
  }

  return undefined;
};
