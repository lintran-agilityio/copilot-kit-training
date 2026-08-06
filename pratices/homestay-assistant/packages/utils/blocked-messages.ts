/**
 * Shared blocked-message policy for AG-UI, Mastra, and web presentation.
 *
 * Canonical rule: user role + (id in blockedIds OR metadata.blocked).
 * Transcript adjacency (next assistant is @@processor-block@@) is presentation
 * only — used by isUserMessageBlockedInTranscript, not LLM filtering.
 */

import {
  isBlockedMessageMetadata,
  isProcessorBlockAssistantContent,
} from "@repo/constants";

export type BlockedMessageLike = {
  id?: string;
  role?: string;
  content?: unknown;
  metadata?: unknown;
};

export const normalizeBlockedMessageIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string");
};

/** True when a user message is blocked by id set and/or metadata.blocked. */
export const isBlockedUserMessage = (
  message: BlockedMessageLike,
  blockedIds?: ReadonlySet<string>,
): boolean => {
  if (message.role !== "user") {
    return false;
  }

  if (typeof message.id === "string" && blockedIds?.has(message.id)) {
    return true;
  }

  return isBlockedMessageMetadata(message.metadata);
};

export const excludeBlockedUserMessages = <T extends BlockedMessageLike>(
  messages: readonly T[],
  blockedIds?: ReadonlySet<string>,
): T[] =>
  messages.filter((message) => !isBlockedUserMessage(message, blockedIds));

/**
 * Presentation: metadata/id policy, or the following assistant reply is a
 * processor-block marker written by the AG-UI tripwire path.
 */
export const isUserMessageBlockedInTranscript = (
  messages: readonly BlockedMessageLike[] | undefined,
  messageId: string,
  blockedIds?: ReadonlySet<string>,
): boolean => {
  if (!messages?.length) {
    return false;
  }

  const index = messages.findIndex((message) => message.id === messageId);

  if (index < 0) {
    return false;
  }

  const message = messages[index];

  if (!message || message.role !== "user") {
    return false;
  }

  if (isBlockedUserMessage(message, blockedIds)) {
    return true;
  }

  const next = messages[index + 1];

  return (
    next?.role === "assistant" &&
    isProcessorBlockAssistantContent(next.content)
  );
};
