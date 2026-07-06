"use client";

import { useCallback, useEffect, useState } from "react";

import type { ChatThread } from "@/features/chat/types";

type UseChatThreadsProps = {
  agentId: string;
  enabled?: boolean;
};

type ChatThreadsResponse = {
  threads?: ChatThread[];
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

  useEffect(() => {
    void refetchThreads();
  }, [refetchThreads]);

  return {
    threads,
    isLoading,
    error,
    refetchThreads,
  };
};
