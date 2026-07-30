import type { ChatMessage, ChatThread } from "@/features/chat/types";

type MastraMessagePart = {
  type?: string;
  text?: unknown;
  toolInvocation?: {
    toolCallId?: string;
    toolName?: string;
    args?: unknown;
  };
};

type MastraMessageContent = {
  content?: unknown;
  parts?: MastraMessagePart[];
};

type RawMastraMessage = {
  id: string;
  role: string;
  content: unknown;
  createdAt?: string;
};

type MastraThreadRecord = {
  id: string;
  title?: string;
  resourceId: string;
  createdAt: string;
  updatedAt: string;
};

type ChatToolCall = NonNullable<ChatMessage["toolCalls"]>[number];

const toIsoString = (value: string | Date | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
};

const toToolCallArguments = (args: unknown) => {
  if (typeof args === "string") {
    return args;
  }

  if (args === undefined || args === null) {
    return "{}";
  }

  try {
    return JSON.stringify(args);
  } catch {
    return "{}";
  }
};

const readMessageText = (parsed: MastraMessageContent, rawContent: string) => {
  const partsText = parsed.parts
    ?.filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text as string)
    .join("")
    .trim();

  if (partsText) {
    return partsText;
  }

  if (typeof parsed.content === "string" && parsed.content.trim()) {
    return parsed.content;
  }

  if (rawContent.trim().startsWith("{")) {
    return "";
  }

  return rawContent;
};

const readToolCalls = (parsed: MastraMessageContent): ChatToolCall[] => {
  const seen = new Set<string>();
  const toolCalls: ChatToolCall[] = [];

  for (const part of parsed.parts ?? []) {
    if (part.type !== "tool-invocation" || !part.toolInvocation) {
      continue;
    }

    const { toolCallId, toolName, args } = part.toolInvocation;

    if (!toolCallId || !toolName || seen.has(toolCallId)) {
      continue;
    }

    seen.add(toolCallId);
    toolCalls.push({
      id: toolCallId,
      type: "function",
      function: {
        name: toolName,
        arguments: toToolCallArguments(args),
      },
    });
  }

  return toolCalls;
};

const readStoredMessage = (row: {
  id: string;
  role: string;
  content: string;
}): ChatMessage => {
  try {
    const parsed = JSON.parse(row.content) as MastraMessageContent;
    const toolCalls = readToolCalls(parsed);
    const content = readMessageText(parsed, row.content);

    return {
      id: row.id,
      role: row.role as ChatMessage["role"],
      content,
      ...(toolCalls.length > 0 ? { toolCalls } : {}),
    };
  } catch {
    return {
      id: row.id,
      role: row.role as ChatMessage["role"],
      content: row.content,
    };
  }
};

export const mapMastraMessageToChatMessage = (
  message: RawMastraMessage,
): ChatMessage => {
  if (typeof message.content === "string") {
    return readStoredMessage({
      id: message.id,
      role: message.role,
      content: message.content,
    });
  }

  if (message.content && typeof message.content === "object") {
    const parsed = message.content as MastraMessageContent;
    const toolCalls = readToolCalls(parsed);
    const content = readMessageText(parsed, "");

    return {
      id: message.id,
      role: message.role as ChatMessage["role"],
      content,
      ...(toolCalls.length > 0 ? { toolCalls } : {}),
    };
  }

  return {
    id: message.id,
    role: message.role as ChatMessage["role"],
    content: "",
  };
};

/**
 * CopilotKit SuggestionEngine sets threadId to a fresh UUID per reload.
 * When those runs used a memory-backed agent, they left ghost threads whose
 * first user message is the injected suggest prompt — hide them from the UI.
 */
export const isSuggestionGenerationThread = (firstUserMessage: ChatMessage | null) => {
  if (!firstUserMessage) {
    return false;
  }

  const content = firstUserMessage.content;

  return (
    content.includes("copilotkitSuggest") ||
    content.startsWith("Suggest what the user could say next.")
  );
};

const getThreadName = ({
  title,
  firstUserMessage,
}: {
  title?: string;
  firstUserMessage: ChatMessage | null;
}) => {
  const trimmedTitle = title?.trim() ?? "";
  const fallbackTitle = firstUserMessage?.content.trim() ?? "";

  return trimmedTitle || fallbackTitle || "New chat";
};

export const mapMastraThreadToChatThread = ({
  thread,
  agentId,
  messageCount,
  lastRunAt,
  firstUserMessage,
}: {
  thread: MastraThreadRecord;
  agentId: string;
  messageCount: number;
  lastRunAt?: string;
  firstUserMessage: ChatMessage | null;
}): ChatThread => ({
  id: thread.id,
  agentId,
  name: getThreadName({ title: thread.title, firstUserMessage }),
  archived: false,
  createdAt: toIsoString(thread.createdAt) ?? new Date().toISOString(),
  updatedAt: toIsoString(thread.updatedAt) ?? new Date().toISOString(),
  ...(lastRunAt ? { lastRunAt } : {}),
  messageCount,
});
