import type { MastraDBMessage } from "@mastra/core/agent";
import type { Processor } from "@mastra/core/processors";
import {
  isBlockedUserMessage,
  normalizeBlockedMessageIds,
} from "@repo/utils";

import { REQUEST_CONTEXT_KEYS } from "@/mastra/middleware/constants";

/** Mastra stores message metadata under content.metadata — keep nesting here. */
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
    const blockedIds = new Set(
      normalizeBlockedMessageIds(
        requestContext?.get(REQUEST_CONTEXT_KEYS.BLOCKED_MESSAGE_IDS),
      ),
    );

    if (blockedIds.size === 0) {
      return messages;
    }

    const filtered = messages.filter(
      (message) =>
        !isBlockedUserMessage(
          {
            id: message.id,
            role: message.role,
            metadata: readMessageMetadata(message),
          },
          blockedIds,
        ),
    );

    return filtered.length === messages.length ? messages : filtered;
  }
}
