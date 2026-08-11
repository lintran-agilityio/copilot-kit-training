import { TOOL_KEYS } from "@repo/constants";

export type IterationToolResultLike = {
  name?: string;
  toolName?: string;
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

const toolNameOf = (tool: {
  name?: string;
  toolName?: string;
}): string | undefined => tool.toolName || tool.name;

const payloadOf = (toolResult: IterationToolResultLike): unknown =>
  toolResult.result ?? toolResult.output;

/**
 * True when a tool result is a successful get_room_by_id payload.
 * Structural only — no room-name or chat-copy matching.
 */
export const isSuccessfulGetRoomByIdToolResult = (
  toolResult: IterationToolResultLike | null | undefined,
): boolean => {
  if (!toolResult || toolResult.error || toolResult.isError) {
    return false;
  }

  if (toolNameOf(toolResult) !== TOOL_KEYS.BOOKING.GET_ROOM_BY_ID) {
    return false;
  }

  const payload = asRecord(payloadOf(toolResult));
  if (!payload) {
    return false;
  }

  const room = asRecord(payload.room);
  const roomIdFromRoom = room?.id;
  if (typeof roomIdFromRoom === "string" && roomIdFromRoom.trim().length > 0) {
    return true;
  }

  const nested = asRecord(payload.value) ?? payload;
  const roomId = nested.roomId;
  return typeof roomId === "string" && roomId.trim().length > 0;
};

const nestedBookingPayload = (
  toolResult: IterationToolResultLike,
): Record<string, unknown> | null => {
  const payload = asRecord(payloadOf(toolResult));
  if (!payload) {
    return null;
  }
  return asRecord(payload.value) ?? payload;
};

const bookingIdFromPayload = (
  nested: Record<string, unknown>,
): string | null => {
  const bookingId = nested.id;
  if (typeof bookingId !== "string" || bookingId.trim().length === 0) {
    return null;
  }
  return bookingId;
};

/**
 * True when create_booking returned a booking id (PENDING/CONFIRMED or status omitted).
 * The HITL confirm card already shows success — no chat confirmation text.
 */
export const isSuccessfulCreateBookingToolResult = (
  toolResult: IterationToolResultLike | null | undefined,
): boolean => {
  if (!toolResult || toolResult.error || toolResult.isError) {
    return false;
  }

  if (toolNameOf(toolResult) !== TOOL_KEYS.BOOKING.CREATE_BOOKING) {
    return false;
  }

  const nested = nestedBookingPayload(toolResult);
  if (!nested || !bookingIdFromPayload(nested)) {
    return false;
  }

  const status =
    typeof nested.status === "string" ? nested.status.toLowerCase() : "";

  if (!status) {
    return true;
  }

  return status === "confirmed" || status === "pending";
};

/**
 * True when update_booking returned a booking id (still active).
 * The modify HITL card already shows success — no chat confirmation text.
 */
export const isSuccessfulUpdateBookingToolResult = (
  toolResult: IterationToolResultLike | null | undefined,
): boolean => {
  if (!toolResult || toolResult.error || toolResult.isError) {
    return false;
  }

  if (toolNameOf(toolResult) !== TOOL_KEYS.BOOKING.UPDATE_BOOKING) {
    return false;
  }

  const nested = nestedBookingPayload(toolResult);
  if (!nested || !bookingIdFromPayload(nested)) {
    return false;
  }

  const status =
    typeof nested.status === "string" ? nested.status.toLowerCase() : "";

  if (!status) {
    return true;
  }

  return status !== "cancelled";
};

/**
 * True when cancel_booking returned a cancelled booking id.
 * The cancel HITL card already shows success — no chat confirmation text.
 */
export const isSuccessfulCancelBookingToolResult = (
  toolResult: IterationToolResultLike | null | undefined,
): boolean => {
  if (!toolResult || toolResult.error || toolResult.isError) {
    return false;
  }

  if (toolNameOf(toolResult) !== TOOL_KEYS.BOOKING.CANCEL) {
    return false;
  }

  const nested = nestedBookingPayload(toolResult);
  if (!nested || !bookingIdFromPayload(nested)) {
    return false;
  }

  const status =
    typeof nested.status === "string" ? nested.status.toLowerCase() : "";

  return status === "cancelled";
};

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
