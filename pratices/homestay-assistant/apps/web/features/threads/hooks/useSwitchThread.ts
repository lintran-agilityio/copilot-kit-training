"use client";

import { useCallback } from "react";
import { useAgent } from "@copilotkit/react-core/v2";

import { useBookingStore } from "@/features/booking/stores/booking-store";
import { useHomestayAgentUiStore } from "@/features/chat/stores/homestay-agent-ui-store";
import { useActiveThread } from "@/features/threads/hooks/useActiveThread";
import { useThreadStore } from "@/features/threads/store/thread-store";
import { useChatStore } from "@/features/chat/stores/chat-store";

type UseSwitchThreadOptions = {
  agentId: string;
};

/**
 * Activate an existing thread. activeThreadId alone switches sidebar + chat.
 */
export const useSwitchThread = ({ agentId }: UseSwitchThreadOptions) => {
  const { agent } = useAgent({ agentId });
  const { scopeKey, activeThreadId, setActiveThread } = useActiveThread({
    agentId,
  });
  const clearPendingOutboundMessage = useChatStore(
    (state) => state.clearPendingOutboundMessage,
  );
  const resetBooking = useBookingStore((state) => state.resetBooking);
  const resetHomestayAgentUi = useHomestayAgentUiStore((state) => state.reset);
  const setLoadError = useThreadStore((state) => state.setLoadError);

  const switchThread = useCallback(
    (threadId: string) => {
      if (!scopeKey || threadId === activeThreadId) {
        return;
      }

      setLoadError(null);
      clearPendingOutboundMessage(scopeKey);
      resetBooking();
      resetHomestayAgentUi();
      agent.setMessages?.([]);
      agent.threadId = threadId;
      setActiveThread(threadId);
    },
    [
      activeThreadId,
      agent,
      clearPendingOutboundMessage,
      resetBooking,
      resetHomestayAgentUi,
      scopeKey,
      setActiveThread,
      setLoadError,
    ],
  );

  return { switchThread };
};
