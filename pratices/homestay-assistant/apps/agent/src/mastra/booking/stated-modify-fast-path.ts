import type {
  ProcessInputStepArgs,
  ProcessInputStepResult,
} from "@mastra/core/processors";

import { TOOL_KEYS } from "@repo/constants";
import { getBusinessDates, getCurrentTurn } from "@repo/utils";

import { REQUEST_CONTEXT_KEYS } from "@/mastra/middleware/constants";
import {
  extractStatedModifyChanges,
  mergeStatedModifyStay,
  resolveBookingFromLookupResult,
  type ModifyStayFields,
} from "@/mastra/booking/stated-modify-changes";
import type { ConfirmedStay } from "@/mastra/utils/confirmed-stay";

type ToolResultLike = {
  toolName?: string;
  input?: unknown;
  output?: unknown;
};

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

const asNonEmptyString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

/**
 * Reads plain text from the latest user message in the current turn.
 */
export const extractLatestUserText = (
  messages: ProcessInputStepArgs["messages"] | undefined,
): string => {
  if (!messages?.length) {
    return "";
  }

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role !== "user") {
      continue;
    }

    const content = asRecord(message.content);
    let text = "";

    const parts = content?.parts;
    if (Array.isArray(parts)) {
      for (const part of parts) {
        const record = asRecord(part);
        if (
          record?.type === "text" &&
          typeof record.text === "string"
        ) {
          text += `${record.text} `;
        }
      }
    }

    if (!text.trim() && typeof content?.content === "string") {
      text = content.content;
    }

    if (!text.trim() && typeof message.content === "string") {
      text = message.content;
    }

    return text.trim();
  }

  return "";
};

/**
 * Last server tool result from agent steps for this turn (not HITL message parts).
 */
const getLastStepToolResult = (
  steps: ProcessInputStepArgs["steps"],
): ToolResultLike | null => {
  const lastStep = steps.at(-1);
  const lastResult = lastStep?.toolResults.at(-1);

  if (!lastResult) {
    return null;
  }

  return lastResult as ToolResultLike;
};

const stashStatedModifyPins = (
  args: ProcessInputStepArgs,
  candidate: ConfirmedStay,
  original: ModifyStayFields,
) => {
  const requestContext = args.requestContext;
  if (!requestContext) {
    return;
  }

  requestContext.set(REQUEST_CONTEXT_KEYS.PENDING_MODIFY_CANDIDATE, candidate);
  requestContext.set(REQUEST_CONTEXT_KEYS.PENDING_MODIFY_ORIGINAL, {
    bookingId: candidate.bookingId,
    ...original,
  });
};

/**
 * After find_booking_by_id / single get_bookings, if the guest already stated
 * the new dates/guests, pin the merged stay and force availability — skipping
 * edit_modify_booking so the date/guest form never opens.
 */
export const tryEnforceStatedModifyFastPath = (
  args: ProcessInputStepArgs,
): ProcessInputStepResult | undefined => {
  const lastToolResult = getLastStepToolResult(args.steps);
  if (!lastToolResult?.toolName) {
    return undefined;
  }

  const resolved = resolveBookingFromLookupResult(
    lastToolResult.toolName,
    lastToolResult.output,
  );
  if (!resolved) {
    return undefined;
  }

  // Only apply when the lookup just finished this turn (no later tools yet).
  const turn = getCurrentTurn(args.messages ?? []);
  const userText = extractLatestUserText(args.messages);
  if (!userText) {
    return undefined;
  }

  // Guard: if this turn already ran availability / edit / confirm, do not re-pin.
  for (const message of turn) {
    if (message?.role === "user") {
      continue;
    }
    const content = asRecord(message?.content);
    const parts = content?.parts;
    if (!Array.isArray(parts)) {
      continue;
    }
    for (const part of parts) {
      const record = asRecord(part);
      const invocation = asRecord(record?.toolInvocation);
      const name =
        asNonEmptyString(invocation?.toolName) ??
        (record?.type === "tool-invocation"
          ? asNonEmptyString(invocation?.toolName)
          : undefined);
      if (
        name === TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY ||
        name === TOOL_KEYS.ACTION.EDIT_MODIFY_BOOKING ||
        name === TOOL_KEYS.ACTION.CONFIRM_MODIFY_BOOKING ||
        name === TOOL_KEYS.BOOKING.SHOW_CANCEL_DIALOG_CONFIRM
      ) {
        return undefined;
      }
    }
  }

  const { today } = getBusinessDates();
  const stated = extractStatedModifyChanges(userText, today);
  if (!stated) {
    return undefined;
  }

  const merged = mergeStatedModifyStay(resolved.current, stated);
  if (!merged) {
    return undefined;
  }

  if (
    resolved.capacity != null &&
    merged.guests > resolved.capacity
  ) {
    // Stop tools so the model can reply with the capacity limit (prompt rule).
    return {
      activeTools: [],
      toolChoice: "none",
    };
  }

  if (!args.tools?.[TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY]) {
    return undefined;
  }

  stashStatedModifyPins(
    args,
    {
      bookingId: resolved.bookingId,
      roomId: resolved.roomId,
      checkInDate: merged.checkInDate,
      checkOutDate: merged.checkOutDate,
      guests: merged.guests,
    },
    resolved.current,
  );

  return {
    activeTools: [TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY],
    toolChoice: {
      type: "tool",
      toolName: TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY,
    },
  };
};
