import {
  getProcessorBlockAssistantDisplayText,
  isBlockedMessageMetadata,
  isProcessorBlockAssistantContent,
} from "@repo/constants";

type MessageWithMetadata = {
  id: string;
  role?: string;
  content?: unknown;
  metadata?: unknown;
};

export const markBlockedMessages = <T extends MessageWithMetadata>(
  messages: T[],
  blockedMessageIds: readonly string[] = [],
): T[] => {
  const blockedIds = new Set(blockedMessageIds);

  for (let index = 0; index < messages.length; index += 1) {
    const message = messages[index];

    if (!message) {
      continue;
    }

    if (
      message.role === "assistant" &&
      isProcessorBlockAssistantContent(message.content)
    ) {
      const previous = messages[index - 1];

      if (previous?.role === "user" && typeof previous.id === "string") {
        blockedIds.add(previous.id);
      }
    }
  }

  let changed = false;

  const marked = messages.map((message) => {
    if (message.role !== "user" || !blockedIds.has(message.id)) {
      return message;
    }

    if (isBlockedMessageMetadata(message.metadata)) {
      return message;
    }

    changed = true;

    return {
      ...message,
      metadata: {
        ...(typeof message.metadata === "object" && message.metadata
          ? message.metadata
          : {}),
        blocked: true,
      },
    };
  });

  return changed ? marked : messages;
};

export const stripProcessorBlockAssistantPrefix = <T extends MessageWithMetadata>(
  messages: T[],
): T[] => {
  let changed = false;

  const sanitized = messages.map((message) => {
    if (
      message.role !== "assistant" ||
      !isProcessorBlockAssistantContent(message.content)
    ) {
      return message;
    }

    changed = true;

    return {
      ...message,
      content: getProcessorBlockAssistantDisplayText(String(message.content)),
    };
  });

  return changed ? sanitized : messages;
};

export const applyBlockedMessageMetadata = <T extends MessageWithMetadata>(
  messages: T[],
  blockedMessageIds: readonly string[] = [],
): T[] =>
  stripProcessorBlockAssistantPrefix(markBlockedMessages(messages, blockedMessageIds));
