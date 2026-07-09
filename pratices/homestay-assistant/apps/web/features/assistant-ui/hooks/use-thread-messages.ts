"use client";

import { useEffect } from "react";
import type { Message } from "@ag-ui/client";

import type { ChatMessage } from "@/features/assistant-ui/types";
import { normalizeMessages } from "@/features/assistant-ui/utils";

type UseThreadMessagesProps = {
  agent: {
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
  useEffect(() => {
    if (!threadId || typeof agent.setMessages !== "function") {
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
        const messages = (data.messages ?? []).map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
        })) as Message[];

        agent.setMessages?.(normalizeMessages(messages) as Message[]);
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
  }, [agent, agentId, threadId]);
};
