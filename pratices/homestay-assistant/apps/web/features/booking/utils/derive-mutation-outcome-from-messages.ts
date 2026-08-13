import { TOOL_KEYS } from "@repo/constants";
import { parseToolResult } from "@repo/utils";

import { BOOKING_MUTATION_PHASE } from "@/features/booking/constants";
import type {
  CreateBookingCardOutcome,
  CancelBookingCardOutcome,
  ModifyBookingCardOutcome,
} from "@/features/booking/stores";
import type {
  CancelBookingResult,
  CreateBookingResult,
  UpdateBookingResult,
} from "@/features/booking/types";
import type { MessageLike } from "@/features/chat/types";
import {
  isCancelBookingSuccess,
  isCreateBookingSuccess,
  isUpdateBookingSuccess,
  buildCancelBookingCorrelationKey,
  buildCreateStayCorrelationKey,
  buildModifyStayCorrelationKey,
  getCancelBookingFailureMessage,
  getCreateBookingFailureMessage,
  getModifyBookingFailureMessage,
} from "@/features/booking/utils";

type MutationToolHit = {
  toolCallId: string;
  args: Record<string, unknown>;
  resultContent: string | null;
};

/**
 * Presentation-only: read mutation tool results from the CopilotKit transcript
 * so HITL cards can recover success/failed after refresh when Zustand is empty.
 * Does not rewrite agent.messages.
 */
const parseToolArguments = (raw: unknown): Record<string, unknown> | null => {
  if (raw == null) {
    return null;
  }

  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }

  if (typeof raw !== "string") {
    return null;
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }

  return null;
};

const readToolResultContent = (
  messages: MessageLike[],
  toolCallId: string,
): string | null => {
  const toolMessage = messages.find(
    (message) => message.role === "tool" && message.toolCallId === toolCallId,
  );

  if (!toolMessage || toolMessage.content == null) {
    return null;
  }

  if (typeof toolMessage.content === "string") {
    return toolMessage.content;
  }

  try {
    return JSON.stringify(toolMessage.content);
  } catch {
    return null;
  }
};

const collectMutationToolHits = (
  messages: MessageLike[] | undefined,
  toolName: string,
): MutationToolHit[] => {
  if (!messages?.length) {
    return [];
  }

  const hits: MutationToolHit[] = [];

  for (const message of messages) {
    if (message.role !== "assistant") {
      continue;
    }

    for (const toolCall of message.toolCalls ?? []) {
      if (toolCall.function?.name !== toolName || !toolCall.id) {
        continue;
      }

      hits.push({
        toolCallId: toolCall.id,
        args: parseToolArguments(toolCall.function.arguments) ?? {},
        resultContent: readToolResultContent(messages, toolCall.id),
      });
    }
  }

  return hits;
};

const findLastHit = (
  hits: MutationToolHit[],
  predicate: (hit: MutationToolHit) => boolean,
): MutationToolHit | null => {
  for (let index = hits.length - 1; index >= 0; index -= 1) {
    const hit = hits[index];

    if (hit && predicate(hit)) {
      return hit;
    }
  }

  return null;
};

const pickHit = (
  hits: MutationToolHit[],
  matchesCorrelationKey: (hit: MutationToolHit) => boolean,
): MutationToolHit | null =>
  findLastHit(
    hits,
    (hit) => hit.resultContent != null && matchesCorrelationKey(hit),
  ) ??
  findLastHit(hits, (hit) => hit.resultContent != null);

const asOptionalString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

const asOptionalNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

/** Prefer live store outcome; fall back to transcript-derived outcome. */
export const coalesceBookingCardOutcome = <T>(
  storeOutcome: T | null | undefined,
  transcriptOutcome: T | null | undefined,
): T | null => storeOutcome ?? transcriptOutcome ?? null;

export const deriveCreateBookingOutcomeFromMessages = (
  messages: MessageLike[] | undefined,
  correlationKey: string | null,
): CreateBookingCardOutcome | null => {
  const hits = collectMutationToolHits(
    messages,
    TOOL_KEYS.BOOKING.CREATE_BOOKING,
  );
  const hit = pickHit(hits, (candidate) => {
    const candidateKey = buildCreateStayCorrelationKey({
      roomId: asOptionalString(candidate.args.roomId),
      checkInDate: asOptionalString(candidate.args.checkInDate),
      checkOutDate: asOptionalString(candidate.args.checkOutDate),
      guests: asOptionalNumber(candidate.args.guests),
    });
    return Boolean(correlationKey && candidateKey === correlationKey);
  });

  if (!hit?.resultContent) {
    return null;
  }

  const resolvedCorrelationKey =
    correlationKey ??
    buildCreateStayCorrelationKey({
      roomId: asOptionalString(hit.args.roomId),
      checkInDate: asOptionalString(hit.args.checkInDate),
      checkOutDate: asOptionalString(hit.args.checkOutDate),
      guests: asOptionalNumber(hit.args.guests),
    }) ??
    hit.toolCallId;

  if (isCreateBookingSuccess(hit.resultContent)) {
    const parsed = parseToolResult<CreateBookingResult>(hit.resultContent);
    const bookingId = parsed?.id?.trim();
    if (!bookingId) {
      return null;
    }

    return {
      correlationKey: resolvedCorrelationKey,
      phase: BOOKING_MUTATION_PHASE.SUCCESS,
      bookingId,
      totalPrice:
        typeof parsed?.totalPrice === "number" ? parsed.totalPrice : undefined,
    };
  }

  return {
    correlationKey: resolvedCorrelationKey,
    phase: BOOKING_MUTATION_PHASE.FAILED,
    errorMessage: getCreateBookingFailureMessage(hit.resultContent),
  };
};

export const deriveCancelBookingOutcomeFromMessages = (
  messages: MessageLike[] | undefined,
  correlationKey: string | null,
): CancelBookingCardOutcome | null => {
  const hits = collectMutationToolHits(messages, TOOL_KEYS.BOOKING.CANCEL);
  const hit = pickHit(hits, (candidate) => {
    const candidateKey = buildCancelBookingCorrelationKey(
      asOptionalString(candidate.args.bookingId),
    );
    return Boolean(correlationKey && candidateKey === correlationKey);
  });

  if (!hit?.resultContent) {
    return null;
  }

  const resolvedCorrelationKey =
    correlationKey ??
    buildCancelBookingCorrelationKey(asOptionalString(hit.args.bookingId)) ??
    hit.toolCallId;

  if (isCancelBookingSuccess(hit.resultContent)) {
    const parsed = parseToolResult<CancelBookingResult>(hit.resultContent);
    const bookingId = parsed?.id?.trim() ?? resolvedCorrelationKey;
    if (!bookingId) {
      return null;
    }

    return {
      correlationKey: resolvedCorrelationKey,
      phase: BOOKING_MUTATION_PHASE.SUCCESS,
      bookingId,
    };
  }

  return {
    correlationKey: resolvedCorrelationKey,
    phase: BOOKING_MUTATION_PHASE.FAILED,
    errorMessage: getCancelBookingFailureMessage(hit.resultContent),
  };
};

export const deriveModifyBookingOutcomeFromMessages = (
  messages: MessageLike[] | undefined,
  correlationKey: string | null,
): ModifyBookingCardOutcome | null => {
  const hits = collectMutationToolHits(
    messages,
    TOOL_KEYS.BOOKING.UPDATE_BOOKING,
  );
  const hit = pickHit(hits, (candidate) => {
    const candidateKey = buildModifyStayCorrelationKey({
      bookingId: asOptionalString(candidate.args.bookingId),
      checkInDate: asOptionalString(candidate.args.checkInDate),
      checkOutDate: asOptionalString(candidate.args.checkOutDate),
      guests: asOptionalNumber(candidate.args.guests),
    });
    return Boolean(correlationKey && candidateKey === correlationKey);
  });

  if (!hit?.resultContent) {
    return null;
  }

  const resolvedCorrelationKey =
    correlationKey ??
    buildModifyStayCorrelationKey({
      bookingId: asOptionalString(hit.args.bookingId),
      checkInDate: asOptionalString(hit.args.checkInDate),
      checkOutDate: asOptionalString(hit.args.checkOutDate),
      guests: asOptionalNumber(hit.args.guests),
    }) ??
    hit.toolCallId;

  if (isUpdateBookingSuccess(hit.resultContent)) {
    const parsed = parseToolResult<UpdateBookingResult>(hit.resultContent);
    const bookingId =
      parsed?.id?.trim() ?? asOptionalString(hit.args.bookingId)?.trim();
    if (!bookingId) {
      return null;
    }

    return {
      correlationKey: resolvedCorrelationKey,
      phase: BOOKING_MUTATION_PHASE.SUCCESS,
      bookingId,
    };
  }

  return {
    correlationKey: resolvedCorrelationKey,
    phase: BOOKING_MUTATION_PHASE.FAILED,
    errorMessage: getModifyBookingFailureMessage(hit.resultContent),
  };
};
