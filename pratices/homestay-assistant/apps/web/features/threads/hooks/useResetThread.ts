"use client";

import { useCallback } from "react";
import { useAgent } from "@copilotkit/react-core/v2";

import { useChatScopeKey } from "@/features/chat/hooks/use-chat-scope-key";
import { useChatStore } from "@/features/chat/stores/chat-store";
import { useBookingStore } from "@/features/booking/stores/booking-store";
import { useHomestayAgentUiStore } from "@/features/chat/stores/homestay-agent-ui-store";
import { useThreadStore } from "@/features/threads/store/thread-store";

type UseResetThreadOptions = {
  agentId: string;
};

/**
 * Clears messages on the current activeThreadId (same id).
 * Prefer useCreateThread for a brand-new conversation context.
 */
export const useResetThread = ({ agentId }: UseResetThreadOptions) => {
  const { scopeKey } = useChatScopeKey(agentId);
  const { agent } = useAgent({ agentId });
  const clearPendingOutboundMessage = useChatStore(
    (state) => state.clearPendingOutboundMessage,
  );
  const resetBooking = useBookingStore((state) => state.resetBooking);
  const resetHomestayAgentUi = useHomestayAgentUiStore((state) => state.reset);
  const setLoadingState = useThreadStore((state) => state.setLoadingState);

  const resetThread = useCallback(() => {
    if (!scopeKey) {
      return;
    }

    clearPendingOutboundMessage(scopeKey);
    agent.setMessages?.([]);
    resetBooking();
    resetHomestayAgentUi();
    setLoadingState("loaded");
  }, [
    agent,
    clearPendingOutboundMessage,
    resetBooking,
    resetHomestayAgentUi,
    scopeKey,
    setLoadingState,
  ]);

  return { resetThread };
};
