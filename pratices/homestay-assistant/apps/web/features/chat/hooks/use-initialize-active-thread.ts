"use client";

import { useEffect } from "react";
import type { Thread } from "@copilotkit/react-core/v2";

import { useChatStore, useChatStoreHasHydrated } from "../stores/chat-store";
import { useActiveThread } from "./use-active-thread";

type UseInitializeActiveThreadInput = {
  agentId: string;
  threads: Thread[];
  isLoading: boolean;
  error: Error | null;
};

export const useInitializeActiveThread = ({
  agentId,
  threads,
  isLoading,
  error,
}: UseInitializeActiveThreadInput) => {
  const {
    activeThreadId,
    isReady,
    scopeKey,
    setActiveThreadId,
    clearActiveThreadId,
  } = useActiveThread(agentId);
  const hasHydrated = useChatStoreHasHydrated();
  const preferDraftMode = useChatStore((state) =>
    scopeKey ? Boolean(state.preferDraftMode[scopeKey]) : false,
  );
  const pendingOutboundMessages = useChatStore(
    (state) => state.pendingOutboundMessages,
  );

  useEffect(() => {
    if (!hasHydrated || !isReady || !scopeKey || isLoading || error) {
      return;
    }

    if (preferDraftMode) {
      return;
    }

    const hasActiveThread =
      activeThreadId && threads.some((thread) => thread.id === activeThreadId);

    if (hasActiveThread) {
      return;
    }

    // A new conversation may set activeThreadId before the merged thread list updates.
    if (activeThreadId && pendingOutboundMessages[scopeKey]) {
      return;
    }

    if (threads[0]) {
      setActiveThreadId(threads[0].id);
      return;
    }

    if (activeThreadId) {
      clearActiveThreadId();
    }
  }, [
    activeThreadId,
    agentId,
    clearActiveThreadId,
    error,
    hasHydrated,
    isLoading,
    isReady,
    pendingOutboundMessages,
    preferDraftMode,
    scopeKey,
    setActiveThreadId,
    threads,
  ]);
};
