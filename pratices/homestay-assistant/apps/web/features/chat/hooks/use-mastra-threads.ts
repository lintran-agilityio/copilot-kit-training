"use client";

import { useCallback, useEffect, useState } from "react";
import type { Thread, UseThreadsResult } from "@copilotkit/react-core/v2";

import {
  createThread as createThreadRequest,
  fetchThreadMessages,
  fetchThreads,
  renameThread as renameThreadRequest,
} from "../services";

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
    const messages = await fetchThreadMessages<TMessage>(threadId, agentId, signal);

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

type UseMastraThreadsInput = {
  agentId: string;
};

export const useMastraThreads = ({
  agentId,
}: UseMastraThreadsInput): UseThreadsResult & {
  agentId: string;
  createThread: (title?: string) => Promise<Thread>;
  refetchThreads: () => Promise<void>;
} => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetchThreads = useCallback(async (signal?: AbortSignal) => {
    try {
      const nextThreads = await fetchThreads(agentId, signal);
      setThreads(nextThreads);
      setError(null);
      setIsLoading(false);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }

      setError(err instanceof Error ? err : new Error(String(err)));
      setIsLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    const controller = new AbortController();

    setIsLoading(true);
    refetchThreads(controller.signal);

    return () => {
      controller.abort();
    };
  }, [refetchThreads]);

  useEffect(() => {
    const onFocus = () => {
      refetchThreads();
    };

    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refetchThreads]);

  const createThread = useCallback(
    async (title?: string) => {
      const thread = await createThreadRequest(agentId, title);
      setThreads((current) => [
        thread,
        ...current.filter((item) => item.id !== thread.id),
      ]);
      return thread;
    },
    [agentId],
  );

  const renameThread = useCallback(
    async (threadId: string, name: string) => {
      const updated = await renameThreadRequest(threadId, agentId, name);
      setThreads((current) =>
        current.map((thread) => (thread.id === threadId ? updated : thread)),
      );
    },
    [agentId],
  );

  const archiveThread = useCallback(async (_threadId: string) => {
    throw new Error("Archive is not supported for Mastra threads yet");
  }, []);

  const deleteThread = useCallback(async (_threadId: string) => {
    throw new Error("Delete is not supported for Mastra threads yet");
  }, []);

  return {
    agentId,
    threads,
    isLoading,
    error,
    hasMoreThreads: false,
    isFetchingMoreThreads: false,
    fetchMoreThreads: () => {},
    renameThread,
    archiveThread,
    deleteThread,
    createThread,
    refetchThreads,
  };
};
