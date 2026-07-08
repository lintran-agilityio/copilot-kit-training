"use client";

import { useCallback, useEffect, useState } from "react";

import type { ChatThread } from "../types";

type UseChatThreadsProps = {
  agentId: string;
  enabled?: boolean;
};

type ChatThreadsResponse = {
  threads?: ChatThread[];
};

type RenameThreadResponse = {
  thread?: ChatThread;
};

export const useChatThreads = ({
  agentId,
  enabled = true,
}: UseChatThreadsProps) => {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);

  const refetchThreads = useCallback(async () => {
    if (!enabled) {
      setThreads([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/threads?${new URLSearchParams({ agentId }).toString()}`,
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch threads: ${response.status}`);
      }

      const data = (await response.json()) as ChatThreadsResponse;
      setThreads(data.threads ?? []);
    } catch (unknownError) {
      setError(
        unknownError instanceof Error
          ? unknownError
          : new Error(String(unknownError)),
      );
    } finally {
      setIsLoading(false);
    }
  }, [agentId, enabled]);

  const renameThread = useCallback(
    async (threadId: string, name: string) => {
      const response = await fetch(`/api/threads/${encodeURIComponent(threadId)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ agentId, name }),
      });

      if (!response.ok) {
        throw new Error(`Failed to rename thread: ${response.status}`);
      }

      const data = (await response.json()) as RenameThreadResponse;

      if (!data.thread) {
        await refetchThreads();
        return;
      }

      setThreads((currentThreads) =>
        currentThreads.map((thread) =>
          thread.id === threadId ? data.thread ?? thread : thread,
        ),
      );
    },
    [agentId, refetchThreads],
  );

  const deleteThread = useCallback(
    async (threadId: string) => {
      const response = await fetch(
        `/api/threads/${encodeURIComponent(threadId)}?${new URLSearchParams({
          agentId,
        }).toString()}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        throw new Error(`Failed to delete thread: ${response.status}`);
      }

      setThreads((currentThreads) =>
        currentThreads.filter((thread) => thread.id !== threadId),
      );
    },
    [agentId],
  );

  useEffect(() => {
    void refetchThreads();
  }, [refetchThreads]);

  return {
    threads,
    isLoading,
    error,
    refetchThreads,
    renameThread,
    deleteThread,
  };
};
