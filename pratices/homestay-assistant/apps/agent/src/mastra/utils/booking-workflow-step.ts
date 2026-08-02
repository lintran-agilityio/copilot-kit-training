import type {
  ProcessInputStepArgs,
  ProcessInputStepResult,
} from "@mastra/core/processors";

import { TOOL_KEYS } from "@repo/constants";

import { REQUEST_CONTEXT_KEYS } from "@/mastra/middleware/constants";
import {
  parseConfirmedStay,
  type ConfirmedStay,
} from "@/mastra/utils/confirmed-stay";

type ToolResultLike = {
  toolName?: string;
  input?: unknown;
  output?: unknown;
};

type BookingWorkflowTransition =
  | { type: "call"; toolName: string }
  | { type: "stop" }
  | null;

/**
 * Narrows unknown JSON-like values to a plain object record.
 *
 * @param value - Raw tool input/output
 * @returns Record when parseable, otherwise null
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
 * Resolves the next booking workflow transition from the latest tool result.
 *
 * @param toolResult - Last tool name/input/output from the agent step
 * @returns Forced next tool, stop, or null when no transition applies
 */
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

/**
 * Reads the last tool result from the most recent agent step.
 *
 * @param steps - Agent step results from prepareStep
 * @returns Last tool result, or null when none exist
 */
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
 * Stores a confirmed HITL stay on request context for the next forced tool.
 *
 * @param args - prepareStep args (needs requestContext)
 * @param toolName - Previous tool that produced the stay
 * @param stay - Parsed confirmed stay
 */
const stashConfirmedStayForNextTool = (
  args: ProcessInputStepArgs,
  toolName: string | undefined,
  stay: ConfirmedStay,
) => {
  const requestContext = args.requestContext;

  if (!requestContext) {
    return;
  }

  if (toolName === TOOL_KEYS.ACTION.EDIT_MODIFY_BOOKING) {
    requestContext.set(REQUEST_CONTEXT_KEYS.PENDING_MODIFY_CANDIDATE, stay);
    return;
  }

  if (toolName === TOOL_KEYS.ACTION.CONFIRM_MODIFY_BOOKING) {
    requestContext.set(REQUEST_CONTEXT_KEYS.PENDING_UPDATE_STAY, stay);
    return;
  }

  if (toolName === TOOL_KEYS.ACTION.CONFIRM_BOOKING) {
    requestContext.set(REQUEST_CONTEXT_KEYS.PENDING_CREATE_STAY, stay);
  }
};

/**
 * Makes booking state transitions deterministic inside an agent run.
 * Forces the next required tool after availability/HITL results and pins the
 * confirmed stay onto request context so server tools ignore stale LLM args.
 *
 * Important: when there is no forced transition, return undefined so CopilotKit
 * frontend HITL tools (confirm/edit/cancel dialogs) stay available. An
 * activeTools allowlist of server tools only would hide those HITL tools.
 *
 * @param args - Mastra prepareStep / processInputStep arguments
 * @returns Tool-choice override for the next step, or undefined
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

  const stay = parseConfirmedStay(lastToolResult.output);

  if (stay) {
    stashConfirmedStayForNextTool(args, lastToolResult.toolName, stay);
  }

  return {
    activeTools: [transition.toolName],
    toolChoice: {
      type: "tool",
      toolName: transition.toolName,
    },
  };
};
