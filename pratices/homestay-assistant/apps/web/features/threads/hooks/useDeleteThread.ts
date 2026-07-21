"use client";

import { useCallback } from "react";
import { useAgent } from "@copilotkit/react-core/v2";

import { useBookingStore } from "@/features/booking/stores/booking-store";
import { useActiveThread } from "@/features/threads/hooks/useActiveThread";
import { useThreadStore } from "@/features/threads/store/thread-store";
import { useChatStore } from "@/features/assistant-ui/stores/chat-store";
import type { Thread } from "@/features/threads/types";

type UseDeleteThreadOptions = {
  agentId: string;
  threads: Thread[];
  deleteThreadRemote: (threadId: string) => Promise<void>;
  onCreateThread: () => void;
};

/**
 * Deletes from Mastra + ThreadStore, then activates latest or creates draft.
 */
export const useDeleteThread = ({
  agentId,
  threads,
  deleteThreadRemote,
  onCreateThread,
}: UseDeleteThreadOptions) => {
  const { agent } = useAgent({ agentId });
  const { scopeKey, activeThreadId, setActiveThread } = useActiveThread({
    agentId,
  });
  const clearPendingOutboundMessage = useChatStore(
    (state) => state.clearPendingOutboundMessage,
  );
  const resetBooking = useBookingStore((state) => state.resetBooking);
  const setLoadingState = useThreadStore((state) => state.setLoadingState);

  const deleteThread = useCallback(
    async (threadId: string) => {
      if (!scopeKey) {
        return;
      }

      await deleteThreadRemote(threadId);

      if (activeThreadId !== threadId) {
        return;
      }

      const nextThread = threads.find((thread) => thread.id !== threadId);

      clearPendingOutboundMessage(scopeKey);
      resetBooking();
      agent.setMessages?.([]);

      if (nextThread) {
        setLoadingState("loading");
        agent.threadId = nextThread.id;
        setActiveThread(nextThread.id);
        return;
      }

      onCreateThread();
    },
    [
      activeThreadId,
      agent,
      clearPendingOutboundMessage,
      deleteThreadRemote,
      onCreateThread,
      resetBooking,
      scopeKey,
      setActiveThread,
      setLoadingState,
      threads,
    ],
  );

  return { deleteThread };
};
