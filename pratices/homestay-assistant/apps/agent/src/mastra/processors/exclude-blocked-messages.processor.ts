import type { MastraDBMessage } from "@mastra/core/agent";
import type { Processor } from "@mastra/core/processors";
import { isBlockedMessageMetadata } from "@repo/constants";

import { REQUEST_CONTEXT_KEYS } from "@/mastra/middleware/constants";

const readMessageMetadata = (message: MastraDBMessage) => {
  const content = message.content;

  if (content && typeof content === "object" && "metadata" in content) {
    const metadata = (content as { metadata?: unknown }).metadata;

    if (metadata && typeof metadata === "object") {
      return metadata;
    }
  }

  return undefined;
};

const isBlockedUserDbMessage = (
  message: MastraDBMessage,
  blockedIds: ReadonlySet<string>,
) => {
  if (message.role !== "user") {
    return false;
  }

  if (typeof message.id === "string" && blockedIds.has(message.id)) {
    return true;
  }

  return isBlockedMessageMetadata(readMessageMetadata(message));
};

export class ExcludeBlockedMessagesProcessor implements Processor {
  id = "exclude-blocked-messages";

  name = "Exclude Blocked Messages";

  processInput({
    messages,
    requestContext,
  }: {
    messages: MastraDBMessage[];
    requestContext?: { get: (key: string) => unknown };
  }) {
    const fromContext = requestContext?.get(
      REQUEST_CONTEXT_KEYS.BLOCKED_MESSAGE_IDS,
    );
    const blockedIds = new Set<string>(
      Array.isArray(fromContext)
        ? fromContext.filter((value): value is string => typeof value === "string")
        : [],
    );

    if (blockedIds.size === 0) {
      return messages;
    }

    const filtered = messages.filter(
      (message) => !isBlockedUserDbMessage(message, blockedIds),
    );

    return filtered.length === messages.length ? messages : filtered;
  }
}
