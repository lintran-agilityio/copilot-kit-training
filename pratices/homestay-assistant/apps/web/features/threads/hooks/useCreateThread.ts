"use client";

import { useCallback } from "react";
import { useAgent } from "@copilotkit/react-core/v2";

import { useChatScopeKey } from "@/features/chat/hooks/use-chat-scope-key";
import { useChatStore } from "@/features/chat/stores/chat-store";
import { useHomestayAgentUiStore } from "@/features/chat/stores/homestay-agent-ui-store";
import { useBookingStore } from "@/features/booking/stores/booking-store";
import { useThreadStore } from "@/features/threads/store/thread-store";

type UseCreateThreadOptions = {
  agentId: string;
};

/**
 * New thread workflow:
 * createDraftThread → set activeThreadId → reset CopilotKit chat
 * → empty conversation → persist on first message (same threadId).
 */
export const useCreateThread = ({ agentId }: UseCreateThreadOptions) => {
  const { scopeKey } = useChatScopeKey(agentId);
  const { agent } = useAgent({ agentId });
  const createDraftThread = useThreadStore((state) => state.createDraftThread);
  const clearPendingOutboundMessage = useChatStore(
    (state) => state.clearPendingOutboundMessage,
  );
  const resetBooking = useBookingStore((state) => state.resetBooking);
  const resetHomestayAgentUi = useHomestayAgentUiStore((state) => state.reset);

  const createThread = useCallback(() => {
    if (!scopeKey) {
      return null;
    }

    const threadId = createDraftThread(scopeKey);
    clearPendingOutboundMessage(scopeKey);

    // Same id must reach AG-UI / Mastra / storage.
    agent.threadId = threadId;
    agent.setMessages?.([]);
    resetBooking();
    resetHomestayAgentUi();

    return threadId;
  }, [
    agent,
    clearPendingOutboundMessage,
    createDraftThread,
    resetBooking,
    resetHomestayAgentUi,
    scopeKey,
  ]);

  return { createThread };
};
