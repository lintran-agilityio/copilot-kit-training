"use client";

import type { UseThreadsResult } from "@copilotkit/react-core/v2";

import { useInitializeActiveThread, useMastraThreads } from "../hooks";
import { ChatThreadContext } from "../contexts/thread-context";
import { useChatStoreHasHydrated } from "../stores/chat-store";

type ChatProviderProps = {
  children: React.ReactNode;
  agentId: string;
};

const INITIAL_THREADS: UseThreadsResult & {
  agentId: string;
  createThread: (title?: string) => Promise<never>;
  refetchThreads: () => Promise<void>;
} = {
  agentId: "",
  threads: [],
  isLoading: true,
  error: null,
  hasMoreThreads: false,
  isFetchingMoreThreads: false,
  fetchMoreThreads: () => {},
  renameThread: async () => {},
  archiveThread: async () => {},
  deleteThread: async () => {},
  createThread: async () => {
    throw new Error("Chat provider is not mounted");
  },
  refetchThreads: async () => {},
};

const ChatProviderContent = ({ children, agentId }: ChatProviderProps) => {
  const initThreads = useMastraThreads({ agentId });

  useInitializeActiveThread({
    agentId,
    threads: initThreads.threads,
    isLoading: initThreads.isLoading,
    error: initThreads.error,
  });

  return <ChatThreadContext value={initThreads}>{children}</ChatThreadContext>;
};

export const ChatProvider = ({ children, agentId }: ChatProviderProps) => {
  const hasHydrated = useChatStoreHasHydrated();

  if (!hasHydrated) {
    return (
      <ChatThreadContext value={{ ...INITIAL_THREADS, agentId }}>
        {children}
      </ChatThreadContext>
    );
  }

  return (
    <ChatProviderContent agentId={agentId}>{children}</ChatProviderContent>
  );
};
