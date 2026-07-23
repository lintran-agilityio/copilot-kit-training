"use client";

// Libs
import dynamic from "next/dynamic";
import { useCallback, useEffect } from "react";
import { useAgent } from "@copilotkit/react-core/v2";
import { cn } from "@repo/utils";
import { AGENT_KEYS } from "@repo/constants";

// Components
import { Navbar } from "@/components/layouts";
import { NavbarTab } from "@repo/types";
import {
  useActiveThread,
  useCreateThread,
  useDeleteThread,
  useSwitchThread,
  useThreads,
  useThreadStore,
} from "@/features/threads";

const ChatSidebar = dynamic(
  () =>
    import("@/features/chat/components/ChatSidebar").then(
      (mod) => mod.ChatSidebar,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-full rounded-xl border border-white/10 bg-white/[0.03]" />
    ),
  },
);

const ThreadSidebar = dynamic(
  () =>
    import("@/features/threads/components/ThreadSidebar").then(
      (mod) => mod.ThreadSidebar,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-56 border-r border-white/10 px-3 py-3 text-xs text-zinc-500">
        Loading threads...
      </div>
    ),
  },
);

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
  const { scopeKey, activeThreadId, setActiveThread } = useActiveThread({
    agentId,
  });
  const { agent } = useAgent({ agentId });
  const { createThread } = useCreateThread({ agentId });
  const { switchThread } = useSwitchThread({ agentId });
  const loadingState = useThreadStore((state) => state.loadingState);
  const {
    threads,
    threadGroups,
    isLoading: isLoadingThreads,
    error: threadsError,
    refetchThreads,
    renameThread,
    deleteThread: deleteThreadRemote,
  } = useThreads({
    agentId,
    enabled: Boolean(scopeKey),
  });

  const handleCreateThread = useCallback(() => {
    createThread();
  }, [createThread]);

  const { deleteThread } = useDeleteThread({
    agentId,
    threads,
    deleteThreadRemote,
    onCreateThread: handleCreateThread,
  });

  // Bootstrap: activate latest persisted thread, or create a draft.
  useEffect(() => {
    if (!scopeKey || activeThreadId) {
      return;
    }

    const latestThread = threads[0];

    if (latestThread) {
      agent.setMessages?.([]);
      agent.threadId = latestThread.id;
      setActiveThread(latestThread.id);
      return;
    }

    if (!isLoadingThreads) {
      handleCreateThread();
    }
  }, [
    activeThreadId,
    agent,
    handleCreateThread,
    isLoadingThreads,
    scopeKey,
    setActiveThread,
    threads,
  ]);

  // Keep AG-UI agent.threadId === activeThreadId at all times.
  useEffect(() => {
    if (activeThreadId) {
      agent.threadId = activeThreadId;
    }
  }, [activeThreadId, agent]);

  // After messages change, refresh persisted list (draft → sidebar row).
  useEffect(() => {
    if (!scopeKey || agent.messages.length === 0) {
      return;
    }

    const refreshTimeout = window.setTimeout(() => {
      void refetchThreads();
    }, 500);

    return () => window.clearTimeout(refreshTimeout);
  }, [agent.messages.length, refetchThreads, scopeKey]);

  const handleRenameThread = useCallback(
    async (threadId: string, name: string) => {
      await renameThread(threadId, name);
    },
    [renameThread],
  );

  return (
    <div className="flex h-screen w-full justify-center mx-2 bg-[#010507]">
      <div
        className={cn(
          "flex flex-col h-full w-full max-w-[1920px] overflow-hidden  bg-[#010507] font-sans",
          className,
        )}
      >
        <Navbar activeTab={activeTab} />
        <div className="flex min-h-0 min-w-0 flex-1">
          <div className="hidden h-full min-h-0 shrink-0 lg:block">
            <ThreadSidebar
              threads={threads}
              threadGroups={threadGroups}
              activeThreadId={activeThreadId}
              isLoading={isLoadingThreads}
              isSwitching={loadingState === "loading"}
              error={threadsError}
              onSelectThread={switchThread}
              onCreateThread={handleCreateThread}
              onRenameThread={handleRenameThread}
              onDeleteThread={deleteThread}
            />
          </div>
          <main className="app-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-8 md:px-4">
            {children}
          </main>
          <div className="hidden h-full min-h-0 w-[min(100%,400px)] shrink-0 lg:block">
            <ChatSidebar className="h-full" agentId={agentId} />
          </div>
        </div>
      </div>
    </div>
  );
};
