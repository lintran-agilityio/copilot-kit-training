"use client";

import { useEffect, useRef } from "react";
import { useCopilotKit } from "@copilotkit/react-core/v2";

import { useThreadStore } from "@/features/threads/store/thread-store";

type UseThreadMessagesProps = {
  agent: {
    threadId?: string;
    setMessages?: (messages: []) => void;
  };
  agentId: string;
  threadId?: string | null;
};

/**
 * Aligns agent.threadId with the active thread and loading UI.
 *
 * Message history is loaded by CopilotKit Intelligence connect/replay when
 * <CopilotChat threadId={...} /> mounts — do not fetch /threads/:id/messages.
 */
export const useThreadMessages = ({
  agent,
  agentId: _agentId,
  threadId,
}: UseThreadMessagesProps) => {
  const agentRef = useRef(agent);
  agentRef.current = agent;
  const loadedThreadIdRef = useRef<string | null>(null);
  const { copilotkit } = useCopilotKit();
  const setLoadingState = useThreadStore((state) => state.setLoadingState);
  const setLoadError = useThreadStore((state) => state.setLoadError);
  const reloadToken = useThreadStore((state) => state.reloadToken);
  const isDraftThread = useThreadStore((state) => state.isDraftThread);
  const isRuntimeConnected =
    copilotkit.runtimeConnectionStatus === "connected";

  useEffect(() => {
    if (!threadId) {
      return;
    }

    const threadChanged = loadedThreadIdRef.current !== threadId;
    loadedThreadIdRef.current = threadId;

    agentRef.current.threadId = threadId;
    setLoadError(null);

    if (isDraftThread(threadId)) {
      setLoadingState("loaded");
      return;
    }

    // Persisted threads: Intelligence connect/replay fills messages after
    // CopilotChat remounts. Clear only when switching threads.
    if (threadChanged) {
      agentRef.current.setMessages?.([]);
    }

    if (isRuntimeConnected) {
      setLoadingState("loaded");
      return;
    }

    setLoadingState("loading");
  }, [
    isDraftThread,
    isRuntimeConnected,
    reloadToken,
    setLoadError,
    setLoadingState,
    threadId,
  ]);
};
