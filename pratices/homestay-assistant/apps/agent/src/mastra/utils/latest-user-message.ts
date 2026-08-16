import type { MastraDBMessage } from "@mastra/core/agent";

/** Concatenated text parts of a message, falling back to raw string content. */
export const extractMessageText = (message: MastraDBMessage): string => {
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

/** Most recent guest-authored message, scanning backward. */
export const findLatestUserMessage = (
  messages: MastraDBMessage[],
): MastraDBMessage | undefined => {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];

    if (message?.role === "user") {
      return message;
    }
  }

  return undefined;
};
