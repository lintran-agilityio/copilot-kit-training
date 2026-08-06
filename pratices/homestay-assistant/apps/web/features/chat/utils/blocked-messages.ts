/**
 * Presentation helpers for security-blocked turns.
 *
 * Do not mutate `agent.messages` to stamp blocked metadata — derive UI state
 * from transcript shape (processor-block assistant after the user) or from
 * metadata already present on the message. Durable blocked ids belong in
 * AG-UI/Mastra (`stream-patch` + thread metadata).
 */

import {
  getProcessorBlockAssistantDisplayText,
  isBlockedMessageMetadata,
  isProcessorBlockAssistantContent,
} from "@repo/constants";

type MessageLike = {
  id?: string;
  role?: string;
  content?: unknown;
  metadata?: unknown;
};

/**
 * True when this user message should render as blocked: explicit metadata, or
 * the following assistant reply is a processor-block marker from stream-patch.
 */
export const isUserMessageBlockedInTranscript = (
  messages: readonly MessageLike[] | undefined,
  messageId: string,
): boolean => {
  if (!messages?.length) {
    return false;
  }

  const index = messages.findIndex((message) => message.id === messageId);

  if (index < 0) {
    return false;
  }

  const message = messages[index];

  if (message?.role !== "user") {
    return false;
  }

  if (isBlockedMessageMetadata(message.metadata)) {
    return true;
  }

  const next = messages[index + 1];

  return (
    next?.role === "assistant" &&
    isProcessorBlockAssistantContent(next.content)
  );
};

/** Strip the durable `@@processor-block@@` marker for assistant bubble text. */
export const getAssistantDisplayContent = (content: unknown): string => {
  if (!isProcessorBlockAssistantContent(content)) {
    return typeof content === "string" ? content : "";
  }

  return getProcessorBlockAssistantDisplayText(String(content));
};
