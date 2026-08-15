import type {
  ProcessInputStepArgs,
  ProcessInputStepResult,
} from "@mastra/core/processors";

import { TOOL_KEYS } from "@repo/constants";
import { getBusinessDates, getCurrentTurn } from "@repo/utils";

import { REQUEST_CONTEXT_KEYS } from "@/mastra/middleware/constants";
import { resolveLastToolResult } from "@/mastra/booking/last-tool-result";
import { narrationOnlyStep } from "@/mastra/booking/step-machine";
import { modifyNoOpNarrationStep } from "@/mastra/booking/modify-noop-narration-step";
import {
  getConfirmedModifyPickerBookingId,
  resolveBookingFromGetBookingsInTurn,
} from "@/mastra/booking/resolve-modify-booking";
import {
  extractStatedModifyChanges,
  resolveBookingFromLookupResult,
} from "./stated-modify-changes";
import {
  applyStatedModifyStay,
  isSameModifyStay,
  ModifyStayFields,
} from "./modify-stay-fields";
import {
  asNonEmptyString,
  asRecord,
  type ConfirmedStay,
} from "@/mastra/utils";

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

    if (!text.trim()) {
      if (typeof content?.content === "string") {
        text = content.content;
      }
      if (typeof message.content === "string") {
        text = message.content;
      }
    }

    return text.trim();
  }

  return "";
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
 *
 * After multi-match picker, prefer the selected booking's stay from get_bookings
 * so stated "guests to 1" is not merged onto a sibling booking (e.g. other A with 2).
 */
export const tryEnforceStatedModifyFastPath = (
  args: ProcessInputStepArgs,
): ProcessInputStepResult | undefined => {
  const lastToolResult = resolveLastToolResult(args);
  if (!lastToolResult?.toolName) {
    return undefined;
  }

  // Picker confirm forces find next — do not merge against the picker payload.
  if (lastToolResult.toolName === TOOL_KEYS.BOOKING.SHOW_MODIFY_DIALOG_SELECT) {
    return undefined;
  }

  const selectedBookingId = getConfirmedModifyPickerBookingId(args.messages);
  const fromPickerList = selectedBookingId
    ? resolveBookingFromGetBookingsInTurn(args.messages, selectedBookingId)
    : null;

  const fromLookup = resolveBookingFromLookupResult(
    lastToolResult.toolName,
    lastToolResult.output,
  );

  // Selected row from get_bookings wins over find/get bookings[0].
  const resolved = fromPickerList ?? fromLookup;
  if (!resolved) {
    return undefined;
  }

  if (
    selectedBookingId &&
    !fromPickerList &&
    fromLookup &&
    fromLookup.bookingId !== selectedBookingId
  ) {
    // Find returned a different booking than the guest picked and we could not
    // hydrate the selected stay — do not pin a stated modify onto the wrong row.
    return undefined;
  }

  const turn = getCurrentTurn(args.messages ?? []);
  const userText = extractLatestUserText(args.messages);
  if (!userText) {
    return undefined;
  }

  // Guard: if this turn already ran availability / edit / confirm, do not re-pin.
  // Do NOT bail on show_modify_dialog_select — that picker runs *before* find and
  // stated-modify must still merge guests/dates after the guest picks a stay.
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

  const merged = applyStatedModifyStay(resolved.current, stated);
  if (merged.checkOutDate <= merged.checkInDate) {
    return undefined;
  }

  // Stated values match the current stay — stop tools + pin narration so the
  // model cannot suggest alternatives and then continue with a second reply.
  if (isSameModifyStay(merged, resolved.current)) {
    return modifyNoOpNarrationStep(args);
  }

  if (
    resolved.capacity != null &&
    merged.guests > resolved.capacity
  ) {
    return narrationOnlyStep();
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
