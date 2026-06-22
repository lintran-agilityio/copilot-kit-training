"use client";

import { useEffect, useState } from "react";
import { useThreads, type UseThreadsResult } from "@copilotkit/react-core/v2";

import { ChatThreadContext } from "../contexts/thread-context";

type ChatProviderProps = {
  children: React.ReactNode;
  agentId: string;
};

const INITIAL_THREADS: UseThreadsResult = {
  threads: [],
  isLoading: true,
  error: null,
  hasMoreThreads: false,
  isFetchingMoreThreads: false,
  fetchMoreThreads: () => {},
  renameThread: async () => {},
  archiveThread: async () => {},
  deleteThread: async () => {},
};

const ChatProviderContent = ({ children, agentId }: ChatProviderProps) => {
  const threads = useThreads({ agentId });

  return <ChatThreadContext value={threads}>{children}</ChatThreadContext>;
};

export const ChatProvider = ({ children, agentId }: ChatProviderProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <ChatThreadContext value={INITIAL_THREADS}>{children}</ChatThreadContext>
    );
  }

  return <ChatProviderContent agentId={agentId}>{children}</ChatProviderContent>;
};
