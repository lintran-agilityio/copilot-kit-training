"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";

import { cn } from "@repo/utils";
import { DeleteThreadDialog } from "@/features/threads/components/DeleteThreadDialog";
import { RenameThreadDialog } from "@/features/threads/components/RenameThreadDialog";
import { ThreadContextMenu } from "@/features/threads/components/ThreadContextMenu";
import type { Thread } from "@/features/threads/types";
import {
  formatThreadActivityLabel,
  getThreadTitle,
} from "@/features/threads/utils";

type ThreadListItemProps = {
  thread: Thread;
  isActive?: boolean;
  isLoading?: boolean;
  onSelect: (threadId: string) => void;
  onRename: (threadId: string, name: string) => Promise<void>;
  onDelete: (threadId: string) => Promise<void>;
};

export const ThreadListItem = ({
  thread,
  isActive = false,
  isLoading = false,
  onSelect,
  onRename,
  onDelete,
}: ThreadListItemProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const title = getThreadTitle(thread);
  const activityLabel = formatThreadActivityLabel(thread);

  const handleConfirmRename = async (name: string) => {
    setIsRenaming(true);

    try {
      await onRename(thread.id, name);
      setIsRenameOpen(false);
    } catch (error) {
      console.error("Failed to rename thread", error);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);

    try {
      await onDelete(thread.id);
      setIsDeleteOpen(false);
    } catch (error) {
      console.error("Failed to delete thread", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className={cn(
        "group relative flex w-full items-center gap-1 rounded-xl px-2.5 py-2 text-left text-xs transition",
        isActive
          ? "bg-white/10 text-white"
          : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200",
        isLoading && isActive && "opacity-70",
      )}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsMenuOpen(false);
        }
      }}
    >
      <button
        type="button"
        onClick={() => onSelect(thread.id)}
        disabled={isLoading && isActive}
        className="min-w-0 flex-1 text-left"
      >
        <span className="block truncate font-medium">{title}</span>
        <span className="mt-0.5 block text-[10px] text-zinc-600">
          {activityLabel}
        </span>
      </button>

      <button
        type="button"
        aria-label={`Open options for ${title}`}
        aria-expanded={isMenuOpen}
        onClick={() => setIsMenuOpen((open) => !open)}
        className="rounded-md p-1 text-zinc-500 opacity-0 transition hover:bg-white/10 hover:text-zinc-200 group-hover:opacity-100 data-[open=true]:opacity-100"
        data-open={isMenuOpen}
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden />
      </button>

      {isMenuOpen ? (
        <ThreadContextMenu
          onRename={() => {
            setIsMenuOpen(false);
            setIsRenameOpen(true);
          }}
          onDelete={() => {
            setIsMenuOpen(false);
            setIsDeleteOpen(true);
          }}
        />
      ) : null}

      <RenameThreadDialog
        open={isRenameOpen}
        initialName={thread.title}
        isSubmitting={isRenaming}
        onCancel={() => setIsRenameOpen(false)}
        onConfirm={handleConfirmRename}
      />

      <DeleteThreadDialog
        open={isDeleteOpen}
        threadLabel={title}
        isDeleting={isDeleting}
        onCancel={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
