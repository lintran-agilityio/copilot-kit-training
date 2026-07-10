"use client";

import { useEffect, useRef } from "react";
import type { Message } from "@ag-ui/client";

import type { ChatMessage } from "@/features/assistant-ui/types";
import {
  mergeHydratedMessages,
  normalizeMessages,
} from "@/features/assistant-ui/utils";

type UseThreadMessagesProps = {
  agent: {
    messages?: Message[];
    setMessages?: (messages: Message[]) => void;
  };
  agentId: string;
  threadId?: string;
};

type ThreadMessagesResponse = {
  messages?: ChatMessage[];
};

export const useThreadMessages = ({
  agent,
  agentId,
  threadId,
}: UseThreadMessagesProps) => {
  const agentRef = useRef(agent);
  agentRef.current = agent;

  useEffect(() => {
    if (!threadId || typeof agentRef.current.setMessages !== "function") {
      return;
    }

    const abortController = new AbortController();

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
        const hydrated = (data.messages ?? []).map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
          ...(message.toolCalls?.length
            ? { toolCalls: message.toolCalls }
            : {}),
        })) as Message[];

        const currentAgent = agentRef.current;
        const merged = mergeHydratedMessages(
          currentAgent.messages ?? [],
          normalizeMessages(hydrated) as Message[],
        );

        currentAgent.setMessages?.(merged);
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error("Failed to load thread messages", error);
        }
      }
    };

    void loadThreadMessages();

    return () => {
      abortController.abort();
    };
  }, [agentId, threadId]);
};
