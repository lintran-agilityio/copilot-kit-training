"use client";

import type { ChatThread } from "@/features/assistant-ui/types";
import { ThreadItem } from "@/features/assistant-ui/components/ThreadItem";

type ChatThreadListProps = {
  threads: ChatThread[];
  currentThreadId?: string;
  isLoading?: boolean;
  onSelectThread: (threadId: string) => void;
  onStartNewThread: () => void;
  onRenameThread: (threadId: string, name: string) => Promise<void>;
  onDeleteThread: (threadId: string) => Promise<void>;
};

export const ChatThreadList = ({
  threads,
  currentThreadId,
  isLoading = false,
  onSelectThread,
  onStartNewThread,
  onRenameThread,
  onDeleteThread,
}: ChatThreadListProps) => {
  return (
    <div className="flex h-full min-h-0 w-48 shrink-0 flex-col border-r border-white/10 px-3 py-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Threads
        </span>
        <button
          type="button"
          onClick={onStartNewThread}
          className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-medium text-zinc-200 transition hover:border-white/25 hover:bg-white/5"
        >
          New thread
        </button>
      </div>

      <div className="app-scrollbar flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="rounded-xl border border-white/5 px-3 py-2 text-xs text-zinc-500">
            Loading threads...
          </div>
        ) : null}

        {!isLoading && threads.length === 0 ? (
          <div className="rounded-xl border border-white/5 px-3 py-2 text-xs text-zinc-500">
            No saved threads yet.
          </div>
        ) : null}

        {threads.map((thread) => (
          <div key={thread.id}>
            <ThreadItem
              key={thread.id}
              thread={thread}
              currentThreadId={currentThreadId}
              onSelectThread={onSelectThread}
              onRenameThread={onRenameThread}
              onDeleteThread={onDeleteThread}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
