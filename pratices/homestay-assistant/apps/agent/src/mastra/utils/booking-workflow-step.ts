import type {
  ProcessInputStepArgs,
  ProcessInputStepResult,
} from "@mastra/core/processors";

import { TOOL_KEYS } from "@repo/constants";

type ToolResultLike = {
  toolName?: string;
  input?: unknown;
  output?: unknown;
};

type BookingWorkflowTransition =
  | { type: "call"; toolName: string }
  | { type: "stop" }
  | null;

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

export const resolveBookingWorkflowTransition = ({
  toolName,
  input,
  output,
}: ToolResultLike): BookingWorkflowTransition => {
  const result = asRecord(output);

  if (!toolName || !result) {
    return null;
  }

  if (toolName === TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY) {
    const nextAction = result.nextAction;

    if (
      nextAction === TOOL_KEYS.ACTION.CONFIRM_BOOKING ||
      nextAction === TOOL_KEYS.ACTION.CONFIRM_MODIFY_BOOKING
    ) {
      return { type: "call", toolName: nextAction };
    }

    if (nextAction === "stop_booking") {
      return { type: "stop" };
    }

    const isAvailable =
      result.available === true && result.guestsWithinCapacity === true;

    if (!isAvailable) {
      return { type: "stop" };
    }

    const availabilityInput = asRecord(input);
    const flow = result.flow ?? availabilityInput?.flow;
    const isModify =
      flow === "modify" ||
      typeof availabilityInput?.excludeBookingId === "string";

    return {
      type: "call",
      toolName: isModify
        ? TOOL_KEYS.ACTION.CONFIRM_MODIFY_BOOKING
        : TOOL_KEYS.ACTION.CONFIRM_BOOKING,
    };
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

const getLastToolResult = (
  steps: ProcessInputStepArgs["steps"],
): ToolResultLike | null => {
  const lastStep = steps.at(-1);
  const lastResult = lastStep?.toolResults.at(-1);

  if (!lastResult) {
    return null;
  }

  return lastResult as ToolResultLike;
};

/**
 * Makes booking state transitions deterministic inside an agent run.
 * Forces the next required tool after availability/HITL results.
 *
 * Important: when there is no forced transition, return undefined so CopilotKit
 * frontend HITL tools (confirm/edit/cancel dialogs) stay available. An
 * activeTools allowlist of server tools only would hide those HITL tools.
 */
export const enforceBookingWorkflowStep = (
  args: ProcessInputStepArgs,
): ProcessInputStepResult | undefined => {
  const lastToolResult = getLastToolResult(args.steps);

  if (!lastToolResult) {
    return undefined;
  }

  const transition = resolveBookingWorkflowTransition(lastToolResult);

  if (!transition) {
    return undefined;
  }

  if (transition.type === "stop") {
    return {
      activeTools: [],
      toolChoice: "none",
    };
  }

  if (!args.tools?.[transition.toolName]) {
    return undefined;
  }

  return {
    activeTools: [transition.toolName],
    toolChoice: {
      type: "tool",
      toolName: transition.toolName,
    },
  };
};
