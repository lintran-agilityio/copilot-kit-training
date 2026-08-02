"use client";

import { useEffect, useRef } from "react";
import type { Message } from "@ag-ui/client";

import type { ChatMessage } from "@/features/chat/types";
import {
  applyBlockedMessageMetadata,
  mergeHydratedMessages,
  normalizeMessages,
} from "@/features/chat/utils";
import { useThreadStore } from "@/features/threads/store/thread-store";

type UseThreadMessagesProps = {
  agent: {
    threadId?: string;
    isRunning?: boolean;
    messages?: Message[];
    setMessages?: (messages: Message[]) => void;
  };
  agentId: string;
  threadId?: string | null;
};

type ThreadMessagesResponse = {
  messages?: ChatMessage[];
};

const toAgentMessages = (messages: ChatMessage[]): Message[] =>
  messages.map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
    ...(message.metadata ? { metadata: message.metadata } : {}),
    ...(message.toolCalls?.length ? { toolCalls: message.toolCalls } : {}),
  })) as Message[];

const finalizeHydratedMessages = (messages: Message[]): Message[] =>
  applyBlockedMessageMetadata(normalizeMessages(messages) as Message[]);

/**
 * Hydrates messages for activeThreadId from Mastra.
 * Draft threads skip fetch (empty chat until first message persists).
 */
export const useThreadMessages = ({
  agent,
  agentId,
  threadId,
}: UseThreadMessagesProps) => {
  const agentRef = useRef(agent);
  agentRef.current = agent;
  const loadedThreadIdRef = useRef<string | null>(null);
  const setLoadingState = useThreadStore((state) => state.setLoadingState);
  const setLoadError = useThreadStore((state) => state.setLoadError);
  const reloadToken = useThreadStore((state) => state.reloadToken);
  const isDraftThread = useThreadStore((state) => state.isDraftThread);

  useEffect(() => {
    if (!threadId || typeof agentRef.current.setMessages !== "function") {
      return;
    }

    const threadChanged = loadedThreadIdRef.current !== threadId;
    loadedThreadIdRef.current = threadId;

    // Keep agent.threadId aligned with activeThreadId before any run.
    agentRef.current.threadId = threadId;

    if (isDraftThread(threadId)) {
      setLoadError(null);
      setLoadingState("loaded");
      return;
    }

    const abortController = new AbortController();
    setLoadError(null);
    setLoadingState("loading");

    const loadThreadMessages = async () => {
      try {
        const response = await fetch(
          `/api/threads/${encodeURIComponent(threadId)}/messages?${new URLSearchParams({ agentId }).toString()}`,
          { signal: abortController.signal },
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch thread messages: ${response.status}`);
        }

        const data = (await response.json()) as ThreadMessagesResponse;
        const hydrated = toAgentMessages(data.messages ?? []);

        if (abortController.signal.aborted) {
          return;
        }

        const currentAgent = agentRef.current;
        currentAgent.threadId = threadId;

        const normalizedHydrated = finalizeHydratedMessages(hydrated);
        const liveMessages = threadChanged ? [] : (currentAgent.messages ?? []);

        const nextMessages = currentAgent.isRunning
          ? finalizeHydratedMessages(
              mergeHydratedMessages(liveMessages, normalizedHydrated),
            )
          : normalizedHydrated;

        currentAgent.setMessages?.(nextMessages);
        setLoadingState("loaded");
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        const message =
          error instanceof Error ? error.message : "Message loading failed";
        console.error("Failed to load thread messages", error);
        setLoadError(message);
      }
    };

    void loadThreadMessages();

    return () => {
      abortController.abort();
    };
  }, [
    agentId,
    isDraftThread,
    reloadToken,
    setLoadError,
    setLoadingState,
    threadId,
  ]);
};
