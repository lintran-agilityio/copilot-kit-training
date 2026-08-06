import { TOOL_KEYS } from "@repo/constants";

type ToolResultLike = {
  toolName?: string;
  input?: unknown;
  output?: unknown;
};

export type BookingStepTransition =
  | { type: "call"; toolName: string }
  | { type: "stop" }
  | null;

/**
 * Narrows unknown JSON-like values to a plain object record.
 */
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
 * Resolves the next booking step-machine transition from the latest tool result.
 * CREATE incomplete/unavailable → booking_draft; MODIFY unavailable → stop.
 */
export const resolveBookingStepTransition = ({
  toolName,
  input,
  output,
}: ToolResultLike): BookingStepTransition => {
  const result = asRecord(output);

  if (!toolName || !result) {
    return null;
  }

  if (toolName === TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY) {
    const nextAction = result.nextAction;
    const availabilityInput = asRecord(input);
    const flow = result.flow ?? availabilityInput?.flow;
    const isModify =
      flow === "modify" ||
      typeof availabilityInput?.excludeBookingId === "string";

    if (
      nextAction === TOOL_KEYS.ACTION.CONFIRM_BOOKING ||
      nextAction === TOOL_KEYS.ACTION.CONFIRM_MODIFY_BOOKING
    ) {
      return { type: "call", toolName: nextAction };
    }

    const isAvailable =
      result.available === true && result.guestsWithinCapacity === true;

    // CREATE recovery: invalid/unavailable stay returns to Booking Draft HITL.
    // MODIFY keeps existing stop behavior.
    if (nextAction === "stop_booking" || !isAvailable) {
      if (isModify) {
        return { type: "stop" };
      }
      return {
        type: "call",
        toolName: TOOL_KEYS.ACTION.BOOKING_DRAFT,
      };
    }

    return {
      type: "call",
      toolName: isModify
        ? TOOL_KEYS.ACTION.CONFIRM_MODIFY_BOOKING
        : TOOL_KEYS.ACTION.CONFIRM_BOOKING,
    };
  }

  if (toolName === TOOL_KEYS.ACTION.BOOKING_DRAFT) {
    if (result.confirmed === true) {
      return {
        type: "call",
        toolName: TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY,
      };
    }
    return { type: "stop" };
  }

  if (toolName === TOOL_KEYS.ACTION.EDIT_MODIFY_BOOKING) {
    return result.confirmed === true
      ? {
          type: "call",
          toolName: TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY,
        }
      : { type: "stop" };
  }

  if (toolName === TOOL_KEYS.BOOKING.SHOW_CANCEL_DIALOG_CONFIRM) {
    return result.confirmed === true
      ? { type: "call", toolName: TOOL_KEYS.BOOKING.CANCEL }
      : { type: "stop" };
  }

  if (toolName === TOOL_KEYS.ACTION.CONFIRM_BOOKING) {
    return result.confirmed === true
      ? { type: "call", toolName: TOOL_KEYS.BOOKING.CREATE_BOOKING }
      : { type: "stop" };
  }

  if (toolName === TOOL_KEYS.ACTION.CONFIRM_MODIFY_BOOKING) {
    return result.confirmed === true
      ? { type: "call", toolName: TOOL_KEYS.BOOKING.UPDATE_BOOKING }
      : { type: "stop" };
  }

  if (
    toolName === TOOL_KEYS.BOOKING.CREATE_BOOKING ||
    toolName === TOOL_KEYS.BOOKING.UPDATE_BOOKING ||
    toolName === TOOL_KEYS.BOOKING.CANCEL
  ) {
    return { type: "stop" };
  }

  return null;
};
