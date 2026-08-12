import { TOOL_KEYS } from "@repo/constants";

import {
  asRecord,
  parseBookingMutationPayload,
  parseGetRoomDetailOutput,
} from "@/mastra/utils";

export type IterationToolResultLike = {
  name?: string;
  toolName?: string;
  /** Framework tool payloads arrive as opaque JSON — narrowed at parse sites. */
  result?: unknown;
  output?: unknown;
  error?: unknown;
  isError?: boolean;
};

export type BookingFormStopIterationContext = {
  toolResults?: IterationToolResultLike[];
  toolCalls?: Array<{ name?: string; toolName?: string }>;
};

export type AgentStepLike = {
  toolResults?: IterationToolResultLike[];
  toolCalls?: Array<{ name?: string; toolName?: string }>;
};

const toolNameOf = (tool: {
  name?: string;
  toolName?: string;
}): string | undefined => tool.toolName || tool.name;

const payloadOf = (toolResult: IterationToolResultLike): unknown =>
  toolResult.result ?? toolResult.output;


type BookingMutationPayload = NonNullable<
  ReturnType<typeof parseBookingMutationPayload>
>;

const isValidToolResult = (
  toolResult: IterationToolResultLike | null | undefined,
  expectedToolName: string,
): toolResult is IterationToolResultLike => {
  return Boolean(
    toolResult &&
      !toolResult.error &&
      !toolResult.isError &&
      toolNameOf(toolResult) === expectedToolName,
  );
};

const isSuccessfulBookingMutation = (
  toolResult: IterationToolResultLike | null | undefined,
  toolName: string,
  predicate: (payload: BookingMutationPayload) => boolean,
): boolean => {
  if (!isValidToolResult(toolResult, toolName)) {
    return false;
  }

  const payload = parseBookingMutationPayload(payloadOf(toolResult));

  return Boolean(payload && predicate(payload));
};

const hasRoomId = (toolResult: IterationToolResultLike): boolean => {
  const payload = payloadOf(toolResult);

  const detail = parseGetRoomDetailOutput(payload);

  if (detail?.room.id.trim()) {
    return true;
  }

  const record = asRecord(payload);

  if (!record) {
    return false;
  }

  const nested = asRecord(record.value) ?? record;
  const roomId = nested.roomId;

  return typeof roomId === "string" && roomId.trim().length > 0;
};

/**
 * True when a tool result is a successful get_room_by_id payload.
 * Structural only — no room-name or chat-copy matching.
 */
export const isSuccessfulGetRoomByIdToolResult = (
  toolResult: IterationToolResultLike | null | undefined,
): boolean =>
  Boolean(
    isValidToolResult(
      toolResult,
      TOOL_KEYS.BOOKING.GET_ROOM_BY_ID,
    ) && hasRoomId(toolResult),
  );

/**
 * True when create_booking returned a booking id (PENDING/CONFIRMED or status omitted).
 * The HITL confirm card already shows success — no chat confirmation text.
 */
export const isSuccessfulCreateBookingToolResult = (
  toolResult: IterationToolResultLike | null | undefined,
): boolean =>
  isSuccessfulBookingMutation(
    toolResult,
    TOOL_KEYS.BOOKING.CREATE_BOOKING,
    ({ status }) => {
      const normalizedStatus = status?.toLowerCase() ?? "";

      return (
        !normalizedStatus ||
        normalizedStatus === "confirmed" ||
        normalizedStatus === "pending"
      );
    },
  );

/**
 * True when update_booking returned a booking id (still active).
 * The modify HITL card already shows success — no chat confirmation text.
 */
export const isSuccessfulUpdateBookingToolResult = (
  toolResult: IterationToolResultLike | null | undefined,
): boolean =>
  isSuccessfulBookingMutation(
    toolResult,
    TOOL_KEYS.BOOKING.UPDATE_BOOKING,
    ({ status }) => status?.toLowerCase() !== "cancelled",
  );

/**
 * True when cancel_booking returned a cancelled booking id.
 * The cancel HITL card already shows success — no chat confirmation text.
 */
export const isSuccessfulCancelBookingToolResult = (
  toolResult: IterationToolResultLike | null | undefined,
): boolean =>
  isSuccessfulBookingMutation(
    toolResult,
    TOOL_KEYS.BOOKING.CANCEL,
    ({ status }) => status?.toLowerCase() === "cancelled",
  );

/** BookingForm open OR mutation HITL success — Generic UI is the response. */
export const isActionableBookingUiToolSuccess = (
  toolResult: IterationToolResultLike | null | undefined,
): boolean =>
  isSuccessfulGetRoomByIdToolResult(toolResult) ||
  isSuccessfulCreateBookingToolResult(toolResult) ||
  isSuccessfulUpdateBookingToolResult(toolResult) ||
  isSuccessfulCancelBookingToolResult(toolResult);

export const shouldStopAfterActionableBookingUi = (
  context: BookingFormStopIterationContext,
): boolean =>
  (context.toolResults ?? []).some(isActionableBookingUiToolSuccess);

/** @deprecated Prefer shouldStopAfterActionableBookingUi */
export const shouldStopAfterSuccessfulGetRoomById =
  shouldStopAfterActionableBookingUi;

/**
 * stopWhen: halt after BookingForm or mutation HITL success (create/update/cancel)
 * so no follow-up LLM step emits redundant chat text the Generic UI already shows.
 */
export const stopWhenBookingFormRendered = ({
  steps,
}: {
  steps: AgentStepLike[];
}): boolean => {
  for (let index = steps.length - 1; index >= 0; index -= 1) {
    const step = steps[index];
    if (!step) {
      continue;
    }

    if (
      shouldStopAfterActionableBookingUi({
        toolResults: step.toolResults,
        toolCalls: step.toolCalls,
      })
    ) {
      return true;
    }
  }

  return false;
};

/** Caps runaway loops when maxSteps is omitted (maxSteps overrides stopWhen). */
export const stopWhenStepLimitReached = (limit: number) => {
  return ({ steps }: { steps: unknown[] }): boolean => steps.length >= limit;
};

/**
 * Mastra onIterationComplete: halt after BookingForm / mutation HITL success.
 */
export const stopAfterBookingFormIteration = (context: {
  toolResults?: IterationToolResultLike[];
  toolCalls?: Array<{ name?: string; toolName?: string }>;
}): { continue: false } | void => {
  if (shouldStopAfterActionableBookingUi(context)) {
    return { continue: false };
  }
};

const ACTIONABLE_BOOKING_UI_SUPPRESS_STATE_KEY =
  "suppressActionableBookingUiText" as const;

const isAssistantTextChunkType = (type: string) =>
  type === "text-delta" || type === "text-start" || type === "text-end";

type StreamChunkLike = {
  type: string;
  payload?: unknown;
};

type ToolResultPayloadLike = {
  toolName?: string;
  result?: unknown;
  isError?: boolean;
};

const asToolResultPayload = (payload: unknown): ToolResultPayloadLike =>
  payload && typeof payload === "object"
    ? (payload as ToolResultPayloadLike)
    : {};

/**
 * After successful get_room_by_id or mutation (create/update/cancel) tool-result,
 * drop later assistant text chunks (BookingForm / HITL success is the response).
 */
export const applyBookingFormHandoffStreamFilter = (
  part: StreamChunkLike,
  state: Record<string, unknown>,
): { emit: boolean } => {
  if (part.type === "tool-result") {
    const payload = asToolResultPayload(part.payload);
    if (
      isActionableBookingUiToolSuccess({
        name: payload.toolName,
        toolName: payload.toolName,
        result: payload.result,
        isError: payload.isError,
      })
    ) {
      state[ACTIONABLE_BOOKING_UI_SUPPRESS_STATE_KEY] = true;
    }
  }

  if (
    state[ACTIONABLE_BOOKING_UI_SUPPRESS_STATE_KEY] === true &&
    isAssistantTextChunkType(part.type)
  ) {
    return { emit: false };
  }

  return { emit: true };
};
