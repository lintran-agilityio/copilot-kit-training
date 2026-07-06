"use client";

import type { ChatThread } from "@/features/chat/types";
import { cn } from "@repo/utils";

type ChatThreadListProps = {
  threads: ChatThread[];
  currentThreadId?: string;
  isLoading?: boolean;
  onSelectThread: (threadId: string) => void;
  onStartNewThread: () => void;
};

const getThreadLabel = (thread: ChatThread) => {
  const name = thread.name?.trim();

  if (!name) {
    return "New chat";
  }

  return name.length > 42 ? `${name.slice(0, 39)}...` : name;
};

export const ChatThreadList = ({
  threads,
  currentThreadId,
  isLoading = false,
  onSelectThread,
  onStartNewThread,
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
          <button
            key={thread.id}
            type="button"
            onClick={() => onSelectThread(thread.id)}
            className={cn(
              "rounded-xl px-3 py-2 text-left text-xs transition",
              currentThreadId === thread.id
                ? "bg-white/10 text-white"
                : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200",
            )}
          >
            <span className="block truncate">{getThreadLabel(thread)}</span>
            <span className="mt-0.5 block text-[10px] text-zinc-600">
              {thread.messageCount} messages
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
