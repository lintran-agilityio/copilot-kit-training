"use client";

import { useCallback, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import {
  useCopilotKit,
  useThreads,
  type Thread,
  type UseThreadsResult,
} from "@copilotkit/react-core/v2";
import { AGENT_URLS } from "@repo/constants";
import { getThreadResourceId } from "@repo/utils";

import { useChatStore } from "../stores/chat-store";
import { normalizeThreadMessages } from "../utils/normalize-thread-messages";

type HydrateThreadMessagesInput<TMessage> = {
  threadId: string;
  agentId: string;
  setMessages: (messages: TMessage[]) => void;
  onHydrated?: () => void;
  signal?: AbortSignal;
};

export const hydrateThreadMessages = async <TMessage>({
  threadId,
  agentId,
  setMessages,
  onHydrated,
  signal,
}: HydrateThreadMessagesInput<TMessage>): Promise<void> => {
  try {
    const params = new URLSearchParams({ agentId });
    const response = await fetch(
      `${AGENT_URLS.HOMESTAY_ASSISTANT}/threads/${threadId}/messages?${params}`,
      { cache: "no-store", signal },
    );

    if (!response.ok) {
      console.error(
        `Failed to hydrate thread messages (${response.status}) for thread ${threadId}`,
      );
      return;
    }

    const data = (await response.json()) as { messages?: TMessage[] };
    const messages = normalizeThreadMessages(data.messages ?? []);

    if (signal?.aborted) {
      return;
    }

    if (typeof setMessages !== "function") {
      return;
    }

    setMessages(messages);

    if (messages.length > 0) {
      onHydrated?.();
    }
  } catch (error) {
    if (signal?.aborted) {
      return;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      return;
    }

    console.error("Failed to hydrate thread messages", error);
  }
};

type UseCopilotThreadsInput = {
  agentId: string;
};

export const useCopilotThreads = ({
  agentId,
}: UseCopilotThreadsInput): UseThreadsResult & {
  agentId: string;
  createThread: (title?: string) => Promise<Thread>;
  refetchThreads: () => Promise<void>;
} => {
  const { user, isLoaded } = useUser();
  const { copilotkit } = useCopilotKit();
  const threadsResult = useThreads({ agentId });
  const threadTitles = useChatStore((state) => state.threadTitles);
  const activeThreadIds = useChatStore((state) => state.activeThreadIds);
  const setThreadTitle = useChatStore((state) => state.setThreadTitle);

  const scopeKey =
    isLoaded && user?.id ? getThreadResourceId(user.id, agentId) : null;

  const localThreadIds = useMemo(() => {
    const ids = new Set<string>();

    for (const threadId of Object.keys(threadTitles)) {
      ids.add(threadId);
    }

    if (scopeKey) {
      const activeThreadId = activeThreadIds[scopeKey];
      if (activeThreadId) {
        ids.add(activeThreadId);
      }
    }

    return ids;
  }, [activeThreadIds, scopeKey, threadTitles]);

  const threads = useMemo(() => {
    const serverThreads = threadsResult.threads.map((thread) => ({
      ...thread,
      name: threadTitles[thread.id] ?? thread.name,
    }));

    const serverThreadIds = new Set(serverThreads.map((thread) => thread.id));
    const now = new Date().toISOString();
    const localThreads: Thread[] = [];

    for (const threadId of localThreadIds) {
      if (serverThreadIds.has(threadId)) {
        continue;
      }

      localThreads.push({
        id: threadId,
        agentId,
        name: threadTitles[threadId] ?? null,
        archived: false,
        createdAt: now,
        updatedAt: now,
      });
    }

    return [...localThreads, ...serverThreads];
  }, [agentId, localThreadIds, threadTitles, threadsResult.threads]);

  const refetchThreads = useCallback(async () => {
    copilotkit.getThreadStore(agentId)?.refresh();
  }, [agentId, copilotkit]);

  const createThread = useCallback(
    async (title?: string): Promise<Thread> => {
      const now = new Date().toISOString();
      const thread: Thread = {
        id: crypto.randomUUID(),
        agentId,
        name: title?.trim() || null,
        archived: false,
        createdAt: now,
        updatedAt: now,
      };

      if (title?.trim()) {
        setThreadTitle(thread.id, title.trim());
      }

      return thread;
    },
    [agentId, setThreadTitle],
  );

  const renameThread = useCallback(
    async (threadId: string, name: string) => {
      setThreadTitle(threadId, name);

      try {
        await threadsResult.renameThread(threadId, name);
      } catch (error) {
        console.warn("CopilotKit thread rename is unavailable in SSE mode", error);
      }
    },
    [setThreadTitle, threadsResult],
  );

  const archiveThread = useCallback(
    async (threadId: string) => {
      try {
        await threadsResult.archiveThread(threadId);
      } catch (error) {
        throw new Error("Archive is not supported without CopilotKit Intelligence", {
          cause: error,
        });
      }
    },
    [threadsResult],
  );

  const deleteThread = useCallback(
    async (threadId: string) => {
      try {
        await threadsResult.deleteThread(threadId);
      } catch (error) {
        throw new Error("Delete is not supported without CopilotKit Intelligence", {
          cause: error,
        });
      }
    },
    [threadsResult],
  );

  return {
    agentId,
    threads,
    isLoading: threadsResult.isLoading,
    error: threadsResult.error,
    hasMoreThreads: threadsResult.hasMoreThreads,
    isFetchingMoreThreads: threadsResult.isFetchingMoreThreads,
    fetchMoreThreads: threadsResult.fetchMoreThreads,
    renameThread,
    archiveThread,
    deleteThread,
    createThread,
    refetchThreads,
  };
};
