import { TOOL_KEYS, TOOL_PURPOSE } from "@repo/constants";

import type { ToolResultPayload } from "@mastra/core/stream";

import {
  asJsonObject,
  asJsonValue,
  parseBookingMutationPayload,
  parseGetRoomDetailOutput,
  type BookingMutationPayload,
  type JsonObject,
  type JsonValue,
} from "@/mastra/utils";
import { createSuppressTextAfterToolResultFilter } from "./suppress-text-after-tool-result";

/**
 * Reads the tool's `toModelOutput` `{ type: "json", value: {...} }` shape.
 * Stream chunk `payload.result` is the RAW execute() return — toModelOutput
 * (where bookingCount/matchCount/replyHint live) is carried separately on
 * `payload.providerMetadata.mastra.modelOutput`.
 */
const asModelOutputValue = (payload: ToolResultPayload): JsonObject | null => {
  const record = asJsonObject(
    asJsonValue(payload.providerMetadata?.mastra?.modelOutput) ?? null,
  );
  if (!record) {
    return null;
  }

  return asJsonObject(record.value) ?? record;
};

/**
 * True when find_room returned matches for a search/recommend turn — Room List
 * renders and IS the response. book_resolve and resolve are excluded: matchCount
 * 0/1/N there still needs a chat reply (error, missing field, or "choose one") —
 * neither purpose ever renders a Room List.
 */
const isFindRoomResultWithMatches = (payload: ToolResultPayload): boolean => {
  if (
    payload.toolName !== TOOL_KEYS.GET.FIND_ROOM ||
    payload.isError
  ) {
    return false;
  }

  const value = asModelOutputValue(payload);
  if (!value) {
    return false;
  }

  const matchCount = value.matchCount;
  return (
    typeof matchCount === "number" &&
    matchCount > 0 &&
    value.purpose !== TOOL_PURPOSE.FIND_ROOM.BOOK_RESOLVE &&
    value.purpose !== TOOL_PURPOSE.FIND_ROOM.RESOLVE
  );
};

/**
 * True when get_bookings returned bookings for a list/view turn — the booking
 * cards (VIEW/LIST) or the HITL that follows (CANCEL/MODIFY disambiguation) is
 * the response either way. purpose "resolve" is excluded: that call only
 * resolves the target booking for cancel/modify/change-room and is followed by
 * a chat reply, same as find_room's book_resolve/resolve exclusion above.
 * Empty results are also excluded: the model still needs to say nothing matched.
 */
const isGetBookingsResultWithMatches = (
  payload: ToolResultPayload,
): boolean => {
  if (payload.toolName !== TOOL_KEYS.BOOKING.GET || payload.isError) {
    return false;
  }

  const value = asModelOutputValue(payload);
  if (!value) {
    return false;
  }

  const bookingCount = value.bookingCount;
  return (
    typeof bookingCount === "number" &&
    bookingCount > 0 &&
    value.purpose !== TOOL_PURPOSE.GET_BOOKINGS.RESOLVE
  );
};

/**
 * After a find_room / get_bookings tool-result chunk that returned results,
 * drop later assistant text chunks in this run. Informational Generic UI
 * (Room List, bookings list) is the response — the guest-facing acknowledgement
 * text the prompt asks the model to skip is now enforced structurally instead
 * of relying on the model to comply.
 */
export const applyListResultsHandoffStreamFilter =
  createSuppressTextAfterToolResultFilter(
    "suppressListResultsText",
    (payload) =>
      isFindRoomResultWithMatches(payload) ||
      isGetBookingsResultWithMatches(payload),
  );


export type IterationToolResultLike = {
  name?: string;
  toolName?: string;
  result?: JsonValue;
  output?: JsonValue;
  error?: JsonValue;
  isError?: boolean;
};

const toolNameOf = (tool: {
  name?: string;
  toolName?: string;
}): string | undefined => tool.toolName || tool.name;

const payloadOf = (
  toolResult: IterationToolResultLike,
): JsonValue | undefined => toolResult.result ?? toolResult.output;

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

  const record = asJsonObject(payload);

  if (!record) {
    return false;
  }

  const nested = asJsonObject(record.value) ?? record;
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

/**
 * After successful get_room_by_id or mutation (create/update/cancel) tool-result,
 * drop later assistant text chunks (BookingForm / HITL success is the response).
 */
export const applyBookingFormHandoffStreamFilter =
  createSuppressTextAfterToolResultFilter(
    "suppressActionableBookingUiText",
    (payload) =>
      isActionableBookingUiToolSuccess({
        name: payload.toolName,
        toolName: payload.toolName,
        result: asJsonValue(payload.result),
        isError: payload.isError,
      }),
  );
