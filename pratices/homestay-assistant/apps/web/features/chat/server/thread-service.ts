import { getAgentResourceId, parseAgentResourceId } from "@repo/utils";

import type { ChatMessage, ChatThread } from "@/features/chat/types";
import { MastraAgentError, mastraAgentRequest } from "@/features/chat/server/mastra-agent-client";
import {
  isSuggestionGenerationThread,
  mapMastraMessageToChatMessage,
  mapMastraThreadToChatThread,
} from "@/features/chat/server/thread-message-mapper";

type MastraThreadRecord = {
  id: string;
  title?: string;
  resourceId: string;
  createdAt: string;
  updatedAt: string;
};

type MastraThreadsResponse = {
  threads?: MastraThreadRecord[];
  page?: {
    total?: number;
    page?: number;
    perPage?: number;
    hasMore?: boolean;
  };
};

type MastraThreadResponse = MastraThreadRecord;

type MastraMessagesResponse = {
  messages?: Array<{
    id: string;
    role: string;
    content: unknown;
    createdAt?: string;
  }>;
  page?: {
    total?: number;
    page?: number;
    perPage?: number;
    hasMore?: boolean;
  };
};

type ThreadRequestContext = {
  userId: string;
  agentId: string;
  clerkToken: string;
};

const CHAT_MESSAGE_ROLES = new Set<ChatMessage["role"]>([
  "assistant",
  "system",
  "tool",
  "user",
]);

const THREADS_PAGE_SIZE = 50;
const MESSAGES_PAGE_SIZE = 100;

const fetchAllMastraThreads = async ({
  clerkToken,
  agentId,
  resourceId,
}: ThreadRequestContext & { resourceId: string }): Promise<MastraThreadRecord[]> => {
  const threads: MastraThreadRecord[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const response = await mastraAgentRequest<MastraThreadsResponse>({
      clerkToken,
      agentId,
      path: "/memory/threads",
      searchParams: {
        agentId,
        resourceId,
        page,
        perPage: THREADS_PAGE_SIZE,
        orderBy: JSON.stringify({ field: "updatedAt", direction: "DESC" }),
      },
    });

    threads.push(...(response.threads ?? []));
    hasMore = response.page?.hasMore ?? false;
    page += 1;
  }

  return threads;
};

const fetchThreadMessages = async ({
  clerkToken,
  agentId,
  resourceId,
  threadId,
  orderBy,
}: ThreadRequestContext & {
  resourceId: string;
  threadId: string;
  orderBy: { field: "createdAt"; direction: "ASC" | "DESC" };
}) => {
  const messages: ChatMessage[] = [];
  let page = 0;
  let hasMore = true;
  let total: number | undefined;

  while (hasMore) {
    const response = await mastraAgentRequest<MastraMessagesResponse>({
      clerkToken,
      agentId,
      path: `/memory/threads/${encodeURIComponent(threadId)}/messages`,
      searchParams: {
        agentId,
        resourceId,
        page,
        perPage: MESSAGES_PAGE_SIZE,
        orderBy: JSON.stringify(orderBy),
      },
    });

    const batch = (response.messages ?? [])
      .filter((message) => CHAT_MESSAGE_ROLES.has(message.role as ChatMessage["role"]))
      .map(mapMastraMessageToChatMessage);

    messages.push(...batch);
    total = response.page?.total ?? total;
    hasMore = response.page?.hasMore ?? batch.length === MESSAGES_PAGE_SIZE;
    page += 1;
  }

  return {
    messages,
    messageCount: total ?? messages.length,
  };
};

const getThreadSummary = async (
  context: ThreadRequestContext & { resourceId: string; threadId: string },
) => {
  const response = await mastraAgentRequest<MastraMessagesResponse>({
    clerkToken: context.clerkToken,
    agentId: context.agentId,
    path: `/memory/threads/${encodeURIComponent(context.threadId)}/messages`,
    searchParams: {
      agentId: context.agentId,
      resourceId: context.resourceId,
      page: 0,
      perPage: 100,
      orderBy: JSON.stringify({ field: "createdAt", direction: "ASC" }),
    },
  });

  const rawMessages = response.messages ?? [];
  const messages = rawMessages
    .filter((message) => CHAT_MESSAGE_ROLES.has(message.role as ChatMessage["role"]))
    .map(mapMastraMessageToChatMessage);

  const firstUserMessage =
    messages.find((message) => message.role === "user") ?? null;
  const lastRawMessage = rawMessages.at(-1);

  return {
    messageCount: response.page?.total ?? messages.length,
    firstUserMessage,
    lastRunAt: lastRawMessage?.createdAt,
  };
};

export const listMastraThreads = async ({
  userId,
  agentId,
  clerkToken,
}: ThreadRequestContext): Promise<ChatThread[]> => {
  const resourceId = getAgentResourceId(userId, agentId);
  const threads = await fetchAllMastraThreads({ userId, agentId, clerkToken, resourceId });

  const enrichedThreads = await Promise.all(
    threads.map(async (thread) => {
      const summary = await getThreadSummary({
        userId,
        agentId,
        clerkToken,
        resourceId,
        threadId: thread.id,
      });

      return {
        thread,
        ...summary,
      };
    }),
  );

  return enrichedThreads
    .filter(({ firstUserMessage }) => !isSuggestionGenerationThread(firstUserMessage))
    .map(({ thread, messageCount, firstUserMessage, lastRunAt }) =>
      mapMastraThreadToChatThread({
        thread,
        agentId: parseAgentResourceId(thread.resourceId).agentId || agentId,
        messageCount,
        lastRunAt,
        firstUserMessage,
      }),
    )
    .filter(
      (thread, index, allThreads) =>
        allThreads.findIndex((candidate) => candidate.id === thread.id) === index,
    );
};

export const renameMastraThread = async ({
  userId,
  agentId,
  threadId,
  name,
  clerkToken,
}: ThreadRequestContext & {
  threadId: string;
  name: string;
}): Promise<ChatThread | null> => {
  const resourceId = getAgentResourceId(userId, agentId);
  const trimmedName = name.trim();

  try {
    await mastraAgentRequest<MastraThreadResponse>({
      clerkToken,
      agentId,
      path: `/memory/threads/${encodeURIComponent(threadId)}`,
      method: "PATCH",
      searchParams: { agentId },
      body: {
        title: trimmedName,
        resourceId,
      },
    });
  } catch (error) {
    if (error instanceof MastraAgentError && error.status === 404) {
      return null;
    }

    throw error;
  }

  const threads = await listMastraThreads({ userId, agentId, clerkToken });

  return threads.find((thread) => thread.id === threadId) ?? null;
};

export const deleteMastraThread = async ({
  userId,
  agentId,
  threadId,
  clerkToken,
}: ThreadRequestContext & {
  threadId: string;
}): Promise<boolean> => {
  const resourceId = getAgentResourceId(userId, agentId);

  try {
    await mastraAgentRequest({
      clerkToken,
      agentId,
      path: `/memory/threads/${encodeURIComponent(threadId)}`,
      method: "DELETE",
      searchParams: {
        agentId,
        resourceId,
      },
    });

    return true;
  } catch (error) {
    if (error instanceof MastraAgentError && error.status === 404) {
      return false;
    }

    throw error;
  }
};

export const listMastraThreadMessages = async ({
  userId,
  agentId,
  threadId,
  clerkToken,
}: ThreadRequestContext & {
  threadId: string;
}): Promise<ChatMessage[]> => {
  const resourceId = getAgentResourceId(userId, agentId);

  try {
    await mastraAgentRequest<MastraThreadResponse>({
      clerkToken,
      agentId,
      path: `/memory/threads/${encodeURIComponent(threadId)}`,
      searchParams: {
        agentId,
        resourceId,
      },
    });
  } catch (error) {
    if (error instanceof MastraAgentError && error.status === 404) {
      return [];
    }

    throw error;
  }

  const { messages } = await fetchThreadMessages({
    userId,
    agentId,
    clerkToken,
    resourceId,
    threadId,
    orderBy: { field: "createdAt", direction: "ASC" },
  });

  return messages;
};
