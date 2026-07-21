"use client";

import type { Thread, ThreadDateGroup } from "@/features/threads/types";
import { NewThreadButton } from "@/features/threads/components/NewThreadButton";
import { ThreadList } from "@/features/threads/components/ThreadList";

type ThreadSidebarProps = {
  threads: Thread[];
  threadGroups: ThreadDateGroup[];
  activeThreadId?: string | null;
  isLoading?: boolean;
  isSwitching?: boolean;
  error?: Error | null;
  onSelectThread: (threadId: string) => void;
  onCreateThread: () => void;
  onRenameThread: (threadId: string, name: string) => Promise<void>;
  onDeleteThread: (threadId: string) => Promise<void>;
};

export const ThreadSidebar = ({
  threads,
  threadGroups,
  activeThreadId,
  isLoading = false,
  isSwitching = false,
  error = null,
  onSelectThread,
  onCreateThread,
  onRenameThread,
  onDeleteThread,
}: ThreadSidebarProps) => {
  return (
    <aside className="flex h-full min-h-0 w-56 shrink-0 flex-col border-r border-white/10 px-3 py-3">
      <div className="mb-3 space-y-2">
        <span className="px-0.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
          Threads
        </span>
        <NewThreadButton onClick={onCreateThread} />
      </div>

      <div className="app-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto pr-1">
        <ThreadList
          groups={threadGroups}
          threads={threads}
          activeThreadId={activeThreadId}
          isLoading={isLoading}
          isSwitching={isSwitching}
          error={error}
          onSelect={onSelectThread}
          onRename={onRenameThread}
          onDelete={onDeleteThread}
        />
      </div>
    </aside>
  );
};
