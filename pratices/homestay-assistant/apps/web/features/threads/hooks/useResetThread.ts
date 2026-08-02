"use client";

import { useCallback } from "react";
import { useAgent, useCopilotKit } from "@copilotkit/react-core/v2";

import { useChatScopeKey } from "@/features/chat/hooks/use-chat-scope-key";
import { useCreateThread } from "@/features/threads/hooks/useCreateThread";
import { useThreadStore } from "@/features/threads/store/thread-store";

type UseResetThreadOptions = {
  agentId: string;
};

/**
 * Clears the conversation for good: deletes the active thread from Mastra and
 * starts an empty draft thread.
 *
 * Clearing only `agent.messages` is not enough — the chat sidebar remounts on
 * every route change and re-hydrates the same thread id from storage, so the
 * conversation would come back on the next screen (and after a reload).
 */
export const useResetThread = ({ agentId }: UseResetThreadOptions) => {
  const { scopeKey } = useChatScopeKey(agentId);
  const { agent } = useAgent({ agentId });
  const { copilotkit } = useCopilotKit();
  const { createThread } = useCreateThread({ agentId });
  const removeThread = useThreadStore((state) => state.deleteThread);
  const persistThread = useThreadStore((state) => state.persistThread);

  const resetThread = useCallback(async () => {
    if (!scopeKey) {
      return;
    }

    const { getActiveThreadId, isDraftThread, threads } =
      useThreadStore.getState();
    const previousThreadId = getActiveThreadId(scopeKey);
    const previousThread = threads.find(
      (thread) => thread.id === previousThreadId,
    );

    // An in-flight run would keep writing to (and so re-create) the thread.
    if (agent.isRunning) {
      copilotkit.stopAgent({ agent });
    }

    createThread();

    // Drafts have no storage row yet, so there is nothing to delete.
    if (!previousThreadId || isDraftThread(previousThreadId)) {
      return;
    }

    removeThread(previousThreadId);

    try {
      const response = await fetch(
        `/api/threads/${encodeURIComponent(previousThreadId)}?${new URLSearchParams(
          { agentId },
        ).toString()}`,
        { method: "DELETE" },
      );

      // 404 means the thread never reached storage — already gone.
      if (!response.ok && response.status !== 404) {
        throw new Error(`Failed to delete thread: ${response.status}`);
      }
    } catch (error) {
      console.error("Failed to delete conversation on reset", error);

      if (previousThread) {
        persistThread(previousThread);
      }
    }
  }, [
    agent,
    agentId,
    copilotkit,
    createThread,
    persistThread,
    removeThread,
    scopeKey,
  ]);

  return { resetThread };
};
