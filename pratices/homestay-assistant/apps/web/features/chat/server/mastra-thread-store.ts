import { MastraClient } from "@mastra/client-js";

import { getAgentResourceId, parseAgentResourceId } from "@repo/utils";
import type { ChatMessage, ChatThread, ChatToolCall } from "@/features/chat/types";
import { getMastraUrl } from "@/utils/urls";

type MastraThread = {
  id: string;
  title?: string;
  resourceId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  metadata?: Record<string, unknown>;
};

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

type MastraApiMessage = {
  id: string;
  role?: string;
  content?: MastraMessageContent | string;
};

let sharedClient: MastraClient | null = null;

const getMastraClient = () => {
  if (!sharedClient) {
    sharedClient = new MastraClient({ baseUrl: getMastraUrl() });
  }

  return sharedClient;
};

const toIsoString = (value: Date | string) => {
  if (typeof value === "string") {
    return value;
  }

  return value.toISOString();
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

const readMessageText = (content: MastraMessageContent | string) => {
  if (typeof content === "string") {
    return content;
  }

  const partsText = content.parts
    ?.filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text as string)
    .join("")
    .trim();

  if (partsText) {
    return partsText;
  }

  if (typeof content.content === "string" && content.content.trim()) {
    return content.content;
  }

  return "";
};

const readToolCalls = (content: MastraMessageContent): ChatToolCall[] => {
  const seen = new Set<string>();
  const toolCalls: ChatToolCall[] = [];

  for (const part of content.parts ?? []) {
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

const mapMastraMessage = (message: MastraApiMessage): ChatMessage | null => {
  const role = message.role;

  if (
    role !== "assistant" &&
    role !== "system" &&
    role !== "tool" &&
    role !== "user"
  ) {
    return null;
  }

  const rawContent = message.content ?? "";
  const contentObject =
    typeof rawContent === "string"
      ? ({ content: rawContent } satisfies MastraMessageContent)
      : rawContent;
  const toolCalls = readToolCalls(contentObject);
  const content = readMessageText(contentObject);

  return {
    id: String(message.id),
    role,
    content,
    ...(toolCalls.length > 0 ? { toolCalls } : {}),
  };
};

/**
 * Legacy SuggestionEngine ghosts used memory-backed manage-assistant.
 * Suggestion runs now use a memory-less provider; keep a title heuristic only.
 */
const isSuggestionGenerationTitle = (title: string | undefined) => {
  if (!title) {
    return false;
  }

  return (
    title.includes("copilotkitSuggest") ||
    title.startsWith("Suggest what the user could say next.")
  );
};

const mapThread = (thread: MastraThread, agentId: string): ChatThread => {
  const createdAt = toIsoString(thread.createdAt);
  const updatedAt = toIsoString(thread.updatedAt);
  const title = thread.title?.trim() || "";

  return {
    id: thread.id,
    agentId: parseAgentResourceId(thread.resourceId).agentId || agentId,
    name: title || "New chat",
    archived: false,
    createdAt,
    updatedAt,
    lastRunAt: updatedAt,
    // Memory list API does not expose counts; UI falls back to updatedAt ordering.
    messageCount: 0,
  };
};

const assertThreadOwnedByResource = async ({
  client,
  agentId,
  threadId,
  resourceId,
}: {
  client: MastraClient;
  agentId: string;
  threadId: string;
  resourceId: string;
}): Promise<MastraThread | null> => {
  try {
    const thread = await client.getMemoryThread({ threadId, agentId }).get();

    if (thread.resourceId !== resourceId) {
      return null;
    }

    return thread;
  } catch {
    return null;
  }
};

export const listMastraThreads = async ({
  userId,
  agentId,
}: {
  userId: string;
  agentId: string;
}): Promise<ChatThread[]> => {
  const client = getMastraClient();
  const resourceId = getAgentResourceId(userId, agentId);
  const response = await client.listMemoryThreads({
    resourceId,
    agentId,
    orderBy: { field: "updatedAt", direction: "DESC" },
    perPage: 100,
    page: 0,
  });

  return (response.threads ?? [])
    .filter((thread) => !isSuggestionGenerationTitle(thread.title))
    .map((thread) => mapThread(thread, agentId))
    .filter(
      (thread, index, allThreads) =>
        allThreads.findIndex((candidate) => candidate.id === thread.id) ===
        index,
    );
};

export const renameMastraThread = async ({
  userId,
  agentId,
  threadId,
  name,
}: {
  userId: string;
  agentId: string;
  threadId: string;
  name: string;
}): Promise<ChatThread | null> => {
  const client = getMastraClient();
  const resourceId = getAgentResourceId(userId, agentId);
  const trimmedName = name.trim();
  const existing = await assertThreadOwnedByResource({
    client,
    agentId,
    threadId,
    resourceId,
  });

  if (!existing) {
    return null;
  }

  const updated = await client.getMemoryThread({ threadId, agentId }).update({
    title: trimmedName,
    metadata: existing.metadata ?? {},
    resourceId,
    agentId,
  });

  return mapThread(updated, agentId);
};

export const deleteMastraThread = async ({
  userId,
  agentId,
  threadId,
}: {
  userId: string;
  agentId: string;
  threadId: string;
}): Promise<boolean> => {
  const client = getMastraClient();
  const resourceId = getAgentResourceId(userId, agentId);
  const existing = await assertThreadOwnedByResource({
    client,
    agentId,
    threadId,
    resourceId,
  });

  if (!existing) {
    return false;
  }

  await client.getMemoryThread({ threadId, agentId }).delete({ agentId });

  return true;
};

export const listMastraThreadMessages = async ({
  userId,
  agentId,
  threadId,
}: {
  userId: string;
  agentId: string;
  threadId: string;
}): Promise<ChatMessage[]> => {
  const client = getMastraClient();
  const resourceId = getAgentResourceId(userId, agentId);
  const existing = await assertThreadOwnedByResource({
    client,
    agentId,
    threadId,
    resourceId,
  });

  if (!existing) {
    return [];
  }

  const { messages } = await client
    .getMemoryThread({ threadId, agentId })
    .listMessages({
      orderBy: { field: "createdAt", direction: "ASC" },
    });

  return messages
    .map((message) => mapMastraMessage(message as MastraApiMessage))
    .filter((message): message is ChatMessage => message !== null);
};
