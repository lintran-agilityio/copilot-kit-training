import type {
  ProcessInputStepArgs,
  ProcessInputStepResult,
} from "@mastra/core/processors";

import { TOOL_KEYS } from "@repo/constants";
import { getCurrentTurn } from "@repo/utils";

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

export type BookingStepTransition =
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
 * Resolves the next booking step-machine transition from the latest tool result.
 *
 * @param toolResult - Last tool name/input/output from the agent step
 * @returns Forced next tool, stop, or null when no transition applies
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

type ToolInvocationLike = {
  state?: string;
  toolName?: string;
  args?: unknown;
  result?: unknown;
};

/**
 * Reads the newest completed tool result from the current turn's messages.
 *
 * CopilotKit frontend HITL tools run in the browser, so their results arrive as
 * message parts and never appear in `steps[].toolResults`. Reading the messages
 * keeps the HITL -> server-tool hop deterministic. The scan stops at the latest
 * user message so a finished booking flow cannot force a transition on a new turn.
 *
 * @param messages - Messages for the current step
 * @returns Last tool result of this turn, or null when none exist
 */
const getLastToolResultFromMessages = (
  messages: ProcessInputStepArgs["messages"] | undefined,
): ToolResultLike | null => {
  if (!messages?.length) {
    return null;
  }

  const turn = getCurrentTurn(messages);

  for (let index = turn.length - 1; index >= 0; index -= 1) {
    const message = turn[index];

    if (message?.role === "user") {
      return null;
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

      if (invocation?.state !== "result" || !invocation.toolName) {
        continue;
      }

      return {
        toolName: invocation.toolName,
        input: invocation.args,
        output: invocation.result,
      };
    }
  }

  return null;
};

type BookingStepSource = {
  toolResult: ToolResultLike;
  transition: Exclude<BookingStepTransition, null>;
};

/**
 * Picks the tool result that decides this step, preferring the agent's own steps
 * and falling back to the messages for browser-executed HITL results.
 *
 * @param args - prepareStep args
 * @returns Deciding tool result with its transition, or null when none applies
 */
const resolveBookingStepSource = (
  args: ProcessInputStepArgs,
): BookingStepSource | null => {
  const candidates = [
    getLastToolResult(args.steps),
    getLastToolResultFromMessages(args.messages),
  ];

  for (const toolResult of candidates) {
    if (!toolResult) {
      continue;
    }

    const transition = resolveBookingStepTransition(toolResult);

    if (transition) {
      return { toolResult, transition };
    }
  }

  return null;
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
 * Pins the booking id the guest just confirmed in the cancel dialog, so
 * cancel_booking uses it instead of a stale id the model may carry over from an
 * earlier turn in the same thread.
 *
 * @param args - prepareStep args (needs requestContext)
 * @param toolName - Previous tool that produced the confirmation
 * @param output - Raw HITL tool output
 */
const stashConfirmedCancelBookingId = (
  args: ProcessInputStepArgs,
  toolName: string | undefined,
  output: unknown,
) => {
  if (toolName !== TOOL_KEYS.BOOKING.SHOW_CANCEL_DIALOG_CONFIRM) {
    return;
  }

  const requestContext = args.requestContext;
  const result = asRecord(output);

  if (!requestContext || result?.confirmed !== true) {
    return;
  }

  const bookingId =
    typeof result.bookingId === "string" ? result.bookingId.trim() : "";

  if (!bookingId) {
    return;
  }

  requestContext.set(REQUEST_CONTEXT_KEYS.PENDING_CANCEL_BOOKING_ID, bookingId);
};

/**
 * Booking step machine: makes tool transitions deterministic inside an agent run.
 * Wired as Mastra `prepareStep`, but this is a state machine — not a generic prepare hook.
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
export const enforceBookingStep = (
  args: ProcessInputStepArgs,
): ProcessInputStepResult | undefined => {
  // Stop: do not force the next tool once the run abortSignal is set.
  if (args.abortSignal?.aborted) {
    return {
      activeTools: [],
      toolChoice: "none",
    };
  }

  const source = resolveBookingStepSource(args);

  if (!source) {
    return undefined;
  }

  const { toolResult: lastToolResult, transition } = source;

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

  // The cancel dialog result carries no dates, so parseConfirmedStay skips it.
  stashConfirmedCancelBookingId(
    args,
    lastToolResult.toolName,
    lastToolResult.output,
  );

  return {
    activeTools: [transition.toolName],
    toolChoice: {
      type: "tool",
      toolName: transition.toolName,
    },
  };
};


/** @deprecated Prefer `BookingStepTransition` — identical type. */
export type BookingWorkflowTransition = BookingStepTransition;

/** @deprecated Prefer `resolveBookingStepTransition`. */
export const resolveBookingWorkflowTransition = resolveBookingStepTransition;
