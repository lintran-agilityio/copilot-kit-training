"use client";

import { useCallback } from "react";
import { useAgent } from "@copilotkit/react-core/v2";

import { useChatScopeKey } from "@/features/assistant-ui/hooks/use-chat-scope-key";
import { useChatStore } from "@/features/assistant-ui/stores/chat-store";
import { useBookingStore } from "@/features/booking/stores/booking-store";
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
  const setLoadingState = useThreadStore((state) => state.setLoadingState);

  const resetThread = useCallback(() => {
    if (!scopeKey) {
      return;
    }

    clearPendingOutboundMessage(scopeKey);
    agent.setMessages?.([]);
    resetBooking();
    setLoadingState("loaded");
  }, [
    agent,
    clearPendingOutboundMessage,
    resetBooking,
    scopeKey,
    setLoadingState,
  ]);

  return { resetThread };
};
