"use client";

import { useUser } from "@clerk/nextjs";
import { getThreadResourceId } from "@repo/utils";

import { useChatStore } from "../stores/chat-store";

export const useActiveThread = (agentId: string) => {
  const { user, isLoaded } = useUser();
  const scopeKey =
    isLoaded && user?.id ? getThreadResourceId(user.id, agentId) : null;

  const activeThreadId = useChatStore((state) =>
    scopeKey ? state.activeThreadIds[scopeKey] : undefined,
  );

  const setActiveThreadId = useChatStore((state) => state.setActiveThreadId);
  const clearActiveThreadId = useChatStore((state) => state.clearActiveThreadId);

  return {
    activeThreadId,
    isReady: Boolean(scopeKey),
    scopeKey,
    setActiveThreadId: (threadId: string) => {
      if (!scopeKey) {
        return;
      }

      setActiveThreadId(scopeKey, threadId);
    },
    clearActiveThreadId: () => {
      if (!scopeKey) {
        return;
      }

      clearActiveThreadId(scopeKey);
    },
  };
};
