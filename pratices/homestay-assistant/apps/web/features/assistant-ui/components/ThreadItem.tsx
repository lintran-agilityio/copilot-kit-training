"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";

import { cn } from "@repo/utils";
import { DeleteThreadDialog } from "@/features/assistant-ui/components/DeleteThreadDialog";
import { RenameThreadDialog } from "@/features/assistant-ui/components/RenameThreadDialog";
import type { ChatThread } from "@/features/assistant-ui/types";
import { OptionsModal } from "@/components/common";

type ThreadItemProps = {
  thread: ChatThread;
  currentThreadId?: string;
  onSelectThread: (threadId: string) => void;
  onRenameThread: (threadId: string, name: string) => Promise<void>;
  onDeleteThread: (threadId: string) => Promise<void>;
};

export const ThreadItem = ({
  thread,
  currentThreadId,
  onSelectThread,
  onRenameThread,
  onDeleteThread,
}: ThreadItemProps) => {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getThreadLabel = (thread: ChatThread) => {
    const name = thread.name?.trim();

    if (!name) {
      return "New chat";
    }

    return name.length > 42 ? `${name.slice(0, 39)}...` : name;
  };

  const threadLabel = getThreadLabel(thread);

  const handleOpenRenameDialog = () => {
    setIsOptionsOpen(false);
    setIsRenameDialogOpen(true);
  };

  const handleOpenDeleteDialog = () => {
    setIsOptionsOpen(false);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmRename = async (name: string) => {
    setIsRenaming(true);

    try {
      await onRenameThread(thread.id, name);
      setIsRenameDialogOpen(false);
    } catch (error) {
      console.error("Failed to rename thread", error);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);

    try {
      await onDeleteThread(thread.id);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Failed to delete thread", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className={cn(
        "group relative flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs transition",
        currentThreadId === thread.id
          ? "bg-white/10 text-white"
          : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
      )}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOptionsOpen(false);
        }
      }}
    >
      <button
        type="button"
        onClick={() => onSelectThread(thread.id)}
        className="min-w-0 flex-1 text-left"
      >
        <span className="block truncate">{threadLabel}</span>
        <span className="mt-0.5 block text-[10px] text-zinc-600">
          {thread.messageCount} messages
        </span>
      </button>
      <button
        type="button"
        aria-label={`Open options for ${threadLabel}`}
        aria-expanded={isOptionsOpen}
        onClick={() => setIsOptionsOpen((isOpen) => !isOpen)}
        className="rounded-md p-1 text-zinc-500 opacity-0 transition hover:bg-white/10 hover:text-zinc-200 group-hover:opacity-100 data-[open=true]:opacity-100"
        data-open={isOptionsOpen}
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
      </button>

      {isOptionsOpen ? (
        <OptionsModal
          renameLabel="Rename"
          deleteLabel="Delete"
          onRename={handleOpenRenameDialog}
          onDelete={handleOpenDeleteDialog}
        />
      ) : null}

      <RenameThreadDialog
        open={isRenameDialogOpen}
        initialName={thread.name?.trim() ?? ""}
        isSubmitting={isRenaming}
        onCancel={() => setIsRenameDialogOpen(false)}
        onConfirm={handleConfirmRename}
      />

      <DeleteThreadDialog
        open={isDeleteDialogOpen}
        threadLabel={threadLabel}
        isDeleting={isDeleting}
        onCancel={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
