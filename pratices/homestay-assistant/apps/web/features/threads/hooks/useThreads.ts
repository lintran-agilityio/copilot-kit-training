"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useAuth } from "@clerk/nextjs";

import type { ChatThread } from "@/features/chat/types";
import type { Thread } from "@/features/threads/types";
import {
  groupThreadsByDate,
  mapChatThreadToThread,
} from "@/features/threads/utils";
import { useThreadStore } from "@/features/threads/store/thread-store";
import { getClerkAuthHeaders } from "@/features/threads/utils/thread-auth-headers";

type UseThreadsOptions = {
  agentId: string;
  enabled?: boolean;
};

type ChatThreadsResponse = {
  threads?: ChatThread[];
};

type RenameThreadResponse = {
  thread?: ChatThread;
};

/**
 * Syncs ThreadStore.threads[] from Mastra via /api/threads.
 * Sidebar renders only persisted threads; drafts stay out until first message.
 */
export const useThreads = ({
  agentId,
  enabled = true,
}: UseThreadsOptions) => {
  const threads = useThreadStore((state) => state.threads);
  const isLoading = useThreadStore((state) => state.threadsLoading);
  const error = useThreadStore((state) => state.threadsError);
  const setPersistedThreads = useThreadStore((state) => state.setPersistedThreads);
  const setThreadsLoading = useThreadStore((state) => state.setThreadsLoading);
  const setThreadsError = useThreadStore((state) => state.setThreadsError);
  const persistThread = useThreadStore((state) => state.persistThread);
  const deleteThreadLocal = useThreadStore((state) => state.deleteThread);
  const { getToken } = useAuth();

  const refetchThreads = useCallback(async () => {
    if (!enabled) {
      setPersistedThreads([]);
      setThreadsLoading(false);
      setThreadsError(null);
      return;
    }

    setThreadsError(null);

    try {
      const response = await fetch(
        `/api/threads?${new URLSearchParams({ agentId }).toString()}`,
        { headers: await getClerkAuthHeaders(getToken) },
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch threads: ${response.status}`);
      }

      const data = (await response.json()) as ChatThreadsResponse;
      setPersistedThreads(
        (data.threads ?? []).map(mapChatThreadToThread),
      );
      setThreadsLoading(false);
    } catch (unknownError) {
      setThreadsError(
        unknownError instanceof Error
          ? unknownError
          : new Error(String(unknownError)),
      );
      setThreadsLoading(false);
    }
  }, [
    agentId,
    enabled,
    getToken,
    setPersistedThreads,
    setThreadsError,
    setThreadsLoading,
  ]);

  const renameThread = useCallback(
    async (threadId: string, name: string) => {
      const authHeaders = await getClerkAuthHeaders(getToken);
      const response = await fetch(
        `/api/threads/${encodeURIComponent(threadId)}`,
        {
          method: "PATCH",
          headers: {
            ...authHeaders,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ agentId, name }),
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to rename thread: ${response.status}`);
      }

      const data = (await response.json()) as RenameThreadResponse;

      if (!data.thread) {
        await refetchThreads();
        return;
      }

      persistThread(mapChatThreadToThread(data.thread));
    },
    [agentId, getToken, persistThread, refetchThreads],
  );

  const deleteThreadRemote = useCallback(
    async (threadId: string) => {
      const response = await fetch(
        `/api/threads/${encodeURIComponent(threadId)}?${new URLSearchParams({
          agentId,
        }).toString()}`,
        {
          method: "DELETE",
          headers: await getClerkAuthHeaders(getToken),
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to delete thread: ${response.status}`);
      }

      deleteThreadLocal(threadId);
    },
    [agentId, deleteThreadLocal, getToken],
  );

  useEffect(() => {
    if (!enabled) {
      setPersistedThreads([]);
      setThreadsLoading(false);
      setThreadsError(null);
      return;
    }

    setThreadsLoading(true);
    void refetchThreads();
  }, [
    enabled,
    refetchThreads,
    setPersistedThreads,
    setThreadsError,
    setThreadsLoading,
  ]);

  const threadGroups = useMemo(
    () => groupThreadsByDate(threads),
    [threads],
  );

  return {
    threads,
    threadGroups,
    isLoading,
    error,
    refetchThreads,
    renameThread,
    deleteThread: deleteThreadRemote,
    persistThread,
  };
};
