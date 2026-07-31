import type { MastraDBMessage } from "@mastra/core/agent";
import type { Processor } from "@mastra/core/processors";
import { AGENT_MAX_USER_MESSAGE_TOKEN_LIMIT } from "@repo/constants";

const estimateTokens = (text: string) => Math.ceil(text.length / 4);

const extractUserText = (message: MastraDBMessage) => {
  let text = "";

  if (message.content.parts) {
    for (const part of message.content.parts) {
      if (part.type === "text" && "text" in part && typeof part.text === "string") {
        text += `${part.text} `;
      }
    }
  }

  if (!text.trim() && typeof message.content.content === "string") {
    text = message.content.content;
  }

  return text.trim();
};

const findLatestUserMessage = (messages: MastraDBMessage[]) => {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];

    if (message?.role === "user") {
      return message;
    }
  }

  return undefined;
};

export class UserMessageTokenLimitProcessor implements Processor {
  id = "user-message-token-limit";

  name = "User Message Token Limit";

  processInput({
    messages,
    abort,
  }: {
    messages: MastraDBMessage[];
    abort: (reason?: string) => never;
  }) {
    const latestUserMessage = findLatestUserMessage(messages);

    if (!latestUserMessage) {
      return messages;
    }

    const text = extractUserText(latestUserMessage);

    if (!text) {
      return messages;
    }

    const tokens = estimateTokens(text);

    if (tokens > AGENT_MAX_USER_MESSAGE_TOKEN_LIMIT) {
      abort(
        `User message exceeds token limit (${tokens} > ${AGENT_MAX_USER_MESSAGE_TOKEN_LIMIT}). Please shorten your message and try again.`,
      );
    }

    return messages;
  }
}
