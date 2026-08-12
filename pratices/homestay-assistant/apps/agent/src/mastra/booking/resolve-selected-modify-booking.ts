import type { ProcessInputStepArgs } from "@mastra/core/processors";

import { TOOL_KEYS } from "@repo/constants";
import { getCurrentTurn } from "@repo/utils";

import type { ResolvedBookingForStatedModify } from "@/mastra/booking/modify-stay-fields";
import {
  asNonEmptyString,
  asPositiveInt,
} from "@/mastra/utils/common";
import { asRecord } from "@/mastra/utils/parse-json-record";

type ToolInvocationLike = {
  state?: string;
  toolName?: string;
  result?: unknown;
};

/**
 * Walks current-turn tool-invocation parts newest-first.
 * Visitor return true to stop.
 */
const forEachTurnToolResult = (
  messages: ProcessInputStepArgs["messages"] | undefined,
  visit: (toolName: string, output: unknown) => boolean,
) => {
  if (!messages?.length) {
    return;
  }

  const turn = getCurrentTurn(messages);

  for (let index = turn.length - 1; index >= 0; index -= 1) {
    const message = turn[index];
    if (message?.role === "user") {
      return;
    }

    const parts = asRecord(message?.content)?.parts;
    if (!Array.isArray(parts)) {
      continue;
    }

    for (let cursor = parts.length - 1; cursor >= 0; cursor -= 1) {
      const part = asRecord(parts[cursor]);
      if (part?.type !== "tool-invocation") {
        continue;
      }

      const invocation = asRecord(part.toolInvocation) as
        | ToolInvocationLike
        | null;
      const toolName = asNonEmptyString(invocation?.toolName);
      if (invocation?.state !== "result" || !toolName) {
        continue;
      }

      if (visit(toolName, invocation.result)) {
        return;
      }
    }
  }
};

/**
 * Booking id the guest confirmed in show_modify_dialog_select this turn.
 */
export const getConfirmedModifyPickerBookingId = (
  messages: ProcessInputStepArgs["messages"] | undefined,
): string | null => {
  let selected: string | null = null;

  forEachTurnToolResult(messages, (toolName, output) => {
    if (toolName !== TOOL_KEYS.BOOKING.SHOW_MODIFY_DIALOG_SELECT) {
      return false;
    }

    const result = asRecord(output);
    if (result?.confirmed !== true) {
      return false;
    }

    selected = asNonEmptyString(result.bookingId) || null;
    return true;
  });

  return selected;
};

const parseGetBookingsRows = (
  output: unknown,
): Array<Record<string, unknown>> | null => {
  const root = asRecord(output);
  if (!root) {
    return null;
  }

  // Some tool wrappers nest under `value`.
  const payload = asRecord(root.value) ?? root;
  const bookings = payload.bookings;
  if (!Array.isArray(bookings)) {
    return null;
  }

  return bookings
    .map((row) => asRecord(row))
    .filter((row): row is Record<string, unknown> => row != null);
};

/**
 * Resolves stay + room from the latest get_bookings in this turn for a booking id.
 * Authoritative after multi-match picker — avoids merging stated changes onto a sibling stay.
 */
export const resolveBookingFromGetBookingsInTurn = (
  messages: ProcessInputStepArgs["messages"] | undefined,
  bookingId: string,
): ResolvedBookingForStatedModify | null => {
  const target = bookingId.trim();
  if (!target) {
    return null;
  }

  let resolved: ResolvedBookingForStatedModify | null = null;

  forEachTurnToolResult(messages, (toolName, output) => {
    if (toolName !== TOOL_KEYS.BOOKING.GET) {
      return false;
    }

    const bookings = parseGetBookingsRows(output);
    if (!bookings?.length) {
      return false;
    }

    const booking = bookings.find(
      (row) => asNonEmptyString(row.id) === target,
    );
    if (!booking) {
      return false;
    }

    const checkInDate = asNonEmptyString(booking.checkInDate);
    const checkOutDate = asNonEmptyString(booking.checkOutDate);
    const guests = asPositiveInt(booking.guests);
    const roomId = asNonEmptyString(booking.roomId);
    const room = asRecord(booking.room);

    if (!checkInDate || !checkOutDate || guests == null || !roomId) {
      return false;
    }

    resolved = {
      bookingId: target,
      roomId,
      capacity: asPositiveInt(room?.capacity),
      current: { checkInDate, checkOutDate, guests },
    };
    return true;
  });

  return resolved;
};
