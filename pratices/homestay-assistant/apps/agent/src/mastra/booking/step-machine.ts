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
import { tryEnforceStatedModifyFastPath } from "@/mastra/booking/stated-modify-fast-path";
import {
  applyBookingDraftHitlResult,
  tryEnforceCreateBookingDraftPath,
} from "@/mastra/booking/create-booking-fast-path";
import {
  resolveBookingStepTransition,
  type BookingStepTransition,
} from "@/mastra/booking/booking-step-transitions";

export type { BookingStepTransition };
export { resolveBookingStepTransition };

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
 * Booking step machine: deterministic tool hops for CREATE (draft-driven) and
 * existing MODIFY/cancel flows. Wired as Mastra `prepareStep`.
 */
export const enforceBookingStep = (
  args: ProcessInputStepArgs,
): ProcessInputStepResult | undefined => {
  if (args.abortSignal?.aborted) {
    return {
      activeTools: [],
      toolChoice: "none",
    };
  }

  const source = resolveBookingStepSource(args);

  if (!source) {
    const createRoute = tryEnforceCreateBookingDraftPath(args);
    if (createRoute) {
      return createRoute;
    }

    return tryEnforceStatedModifyFastPath(args);
  }

  const { toolResult: lastToolResult, transition } = source;

  if (lastToolResult.toolName === TOOL_KEYS.ACTION.BOOKING_DRAFT) {
    applyBookingDraftHitlResult(args, lastToolResult.output);
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

/** @deprecated Prefer `BookingStepTransition`. */
export type BookingWorkflowTransition = BookingStepTransition;

/** @deprecated Prefer `resolveBookingStepTransition`. */
export const resolveBookingWorkflowTransition = resolveBookingStepTransition;
