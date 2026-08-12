import type {
  ProcessInputStepArgs,
  ProcessInputStepResult,
} from "@mastra/core/processors";

import { TOOL_KEYS } from "@repo/constants";

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
 * - book_resolve + exactly one match → continue BOOK, but block re-calling find_room/get_rooms
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
      return excludeSearchLoopTools(args);
    }

    return narrationOnlyStep();
  }

  if (lastToolResult.toolName === TOOL_KEYS.GET.ROOMS) {
    return excludeSearchLoopTools(args);
  }

  return undefined;
};
