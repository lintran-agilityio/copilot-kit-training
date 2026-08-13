import { TOOL_KEYS } from "@repo/constants";

import { asRecord } from "@/mastra/utils";

type StreamChunkLike = {
  type: string;
  payload?: unknown;
};

type ToolResultPayloadLike = {
  toolName?: string;
  isError?: boolean;
  providerMetadata?: {
    mastra?: {
      modelOutput?: unknown;
    };
  };
};

const asToolResultPayload = (payload: unknown): ToolResultPayloadLike =>
  payload && typeof payload === "object"
    ? (payload as ToolResultPayloadLike)
    : {};

/**
 * Reads the tool's `toModelOutput` `{ type: "json", value: {...} }` shape.
 * Stream chunk `payload.result` is the RAW execute() return — toModelOutput
 * (where bookingCount/matchCount/replyHint live) is carried separately on
 * `payload.providerMetadata.mastra.modelOutput`.
 */
const asModelOutputValue = (
  payload: ToolResultPayloadLike,
): Record<string, unknown> | null => {
  const record = asRecord(payload.providerMetadata?.mastra?.modelOutput);
  if (!record) {
    return null;
  }

  return asRecord(record.value) ?? record;
};

/**
 * True when find_room returned matches for a search/recommend turn — Room List
 * renders and IS the response. book_resolve is excluded: matchCount 0/1/N there
 * still needs a chat reply (error, missing field, or "choose one").
 */
const isFindRoomResultWithMatches = (
  payload: ToolResultPayloadLike,
): boolean => {
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
    value.purpose !== "book_resolve"
  );
};

/**
 * True when get_bookings returned bookings — the booking cards (VIEW/LIST) or
 * the HITL that follows (CANCEL/MODIFY disambiguation) is the response either way.
 * Empty results are excluded: the model still needs to say nothing matched.
 */
const isGetBookingsResultWithMatches = (
  payload: ToolResultPayloadLike,
): boolean => {
  if (payload.toolName !== TOOL_KEYS.BOOKING.GET || payload.isError) {
    return false;
  }

  const value = asModelOutputValue(payload);
  if (!value) {
    return false;
  }

  const bookingCount = value.bookingCount;
  return typeof bookingCount === "number" && bookingCount > 0;
};

const SUPPRESS_LIST_RESULTS_TEXT_STATE_KEY =
  "suppressListResultsText" as const;

const isAssistantTextChunkType = (type: string) =>
  type === "text-delta" || type === "text-start" || type === "text-end";

/**
 * After a find_room / get_bookings tool-result chunk that returned results,
 * drop later assistant text chunks in this run. Informational Generic UI
 * (Room List, bookings list) is the response — the guest-facing acknowledgement
 * text the prompt asks the model to skip is now enforced structurally instead
 * of relying on the model to comply.
 */
export const applyListResultsHandoffStreamFilter = (
  part: StreamChunkLike,
  state: Record<string, unknown>,
): { emit: boolean } => {
  if (part.type === "tool-result") {
    const payload = asToolResultPayload(part.payload);
    if (
      isFindRoomResultWithMatches(payload) ||
      isGetBookingsResultWithMatches(payload)
    ) {
      state[SUPPRESS_LIST_RESULTS_TEXT_STATE_KEY] = true;
    }
  }

  if (
    state[SUPPRESS_LIST_RESULTS_TEXT_STATE_KEY] === true &&
    isAssistantTextChunkType(part.type)
  ) {
    return { emit: false };
  }

  return { emit: true };
};
