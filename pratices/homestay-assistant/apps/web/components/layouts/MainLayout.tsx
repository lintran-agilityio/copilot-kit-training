"use client";

// Libs
import { useCallback, useEffect } from "react";
import { useAgent } from "@copilotkit/react-core/v2";
import { cn } from "@repo/utils";
import { AGENT_KEYS } from "@repo/constants";

// Components
import { Navbar } from "@/components/layouts";
import { ChatSidebar } from "@/features/chat/components";
import { NavbarTab } from "@repo/types";
import { ChatThreadList } from "@/features/chat/components/ChatThreadList";
import { useChatScopeKey, useChatThreads } from "@/features/chat/hooks";
import { useChatStore } from "@/features/chat/stores/chat-store";

type MainLayoutProps = {
  children: React.ReactNode;
  className?: string;
  activeTab?: NavbarTab.HOME | NavbarTab.MY_BOOKINGS;
};

export const MainLayout = ({
  children,
  className,
  activeTab = NavbarTab.HOME,
}: MainLayoutProps) => {
  const agentId = AGENT_KEYS.MANAGE_ASSISTANT;
  const { scopeKey } = useChatScopeKey(agentId);
  const currentThreadId = useChatStore((state) =>
    scopeKey ? state.currentThreadIds[scopeKey] : undefined,
  );
  const setCurrentThreadId = useChatStore((state) => state.setCurrentThreadId);
  const startNewThread = useChatStore((state) => state.startNewThread);
  const { agent } = useAgent({ agentId });
  const {
    threads,
    isLoading: isLoadingThreads,
    refetchThreads,
    renameThread,
    deleteThread,
  } = useChatThreads({
    agentId,
    enabled: Boolean(scopeKey),
  });

  useEffect(() => {
    if (!scopeKey || currentThreadId) {
      return;
    }

    const latestThread = threads[0];

    if (latestThread) {
      setCurrentThreadId(scopeKey, latestThread.id);
      return;
    }

    if (!isLoadingThreads) {
      startNewThread(scopeKey);
    }
  }, [
    currentThreadId,
    isLoadingThreads,
    scopeKey,
    setCurrentThreadId,
    startNewThread,
    threads,
  ]);

  useEffect(() => {
    if (currentThreadId) {
      agent.threadId = currentThreadId;
    }
  }, [agent, currentThreadId]);

  useEffect(() => {
    if (!scopeKey || agent.messages.length === 0) {
      return;
    }

    const refreshTimeout = window.setTimeout(() => {
      void refetchThreads();
    }, 500);

    return () => window.clearTimeout(refreshTimeout);
  }, [agent.messages.length, refetchThreads, scopeKey]);

  const handleSelectThread = useCallback(
    (threadId: string) => {
      if (!scopeKey) {
        return;
      }

      agent.threadId = threadId;
      agent.setMessages?.([]);
      setCurrentThreadId(scopeKey, threadId);
    },
    [agent, scopeKey, setCurrentThreadId],
  );

  const handleStartNewThread = useCallback(() => {
    if (!scopeKey) {
      return;
    }

    const threadId = startNewThread(scopeKey);
    agent.threadId = threadId;
    agent.setMessages?.([]);
  }, [agent, scopeKey, startNewThread]);

  const handleRenameThread = useCallback(
    async (threadId: string, name: string) => {
      await renameThread(threadId, name);
    },
    [renameThread],
  );

  const handleDeleteThread = useCallback(
    async (threadId: string) => {
      if (!scopeKey) {
        return;
      }

      await deleteThread(threadId);

      if (currentThreadId !== threadId) {
        return;
      }

      const nextThread = threads.find((thread) => thread.id !== threadId);

      if (nextThread) {
        agent.threadId = nextThread.id;
        agent.setMessages?.([]);
        setCurrentThreadId(scopeKey, nextThread.id);
        return;
      }

      const nextThreadId = startNewThread(scopeKey);
      agent.threadId = nextThreadId;
      agent.setMessages?.([]);
    },
    [
      agent,
      currentThreadId,
      deleteThread,
      scopeKey,
      setCurrentThreadId,
      startNewThread,
      threads,
    ],
  );

  return (
    <div className="flex h-screen w-full justify-center mx-2 bg-[#010507]">
      <div
        className={cn(
          "flex flex-col h-full w-full max-w-[1920px] overflow-hidden  bg-[#010507] font-sans",
          className
        )}
      >
        <Navbar activeTab={activeTab} />
        <div className="flex min-h-0 min-w-0 flex-1">
          <div className="hidden h-full min-h-0 shrink-0 lg:block">
            <ChatThreadList
              threads={threads}
              currentThreadId={currentThreadId}
              isLoading={isLoadingThreads}
              onSelectThread={handleSelectThread}
              onStartNewThread={handleStartNewThread}
              onRenameThread={handleRenameThread}
              onDeleteThread={handleDeleteThread}
            />
          </div>
          <main className="app-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-8 md:px-4">
            {children}
          </main>
          <div className="hidden h-full min-h-0 w-[min(100%,380px)] shrink-0 lg:block">
            <ChatSidebar
              className="h-full"
              agentId={agentId}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
