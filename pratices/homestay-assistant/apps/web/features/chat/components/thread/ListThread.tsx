"use client";

import { useMemo } from "react";

import { Loading, ErrorMessages } from "@repo/components";
import { ThreadItem } from "./ThreadItem";
import { useThreadContext } from "@/features/chat/contexts/thread-context";

type ListThreadProps = {
  onItemSelect: () => void;
  searchQuery?: string;
};

const matchesSearch = (name: string | null, query: string) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  return (name ?? "Untitled").toLowerCase().includes(normalizedQuery);
};

export const ListThread = ({ onItemSelect, searchQuery = "" }: ListThreadProps) => {
  const {
    isLoading,
    error,
    threads,
  } = useThreadContext();

  const filteredThreads = useMemo(
    () => threads.filter((thread) => matchesSearch(thread.name, searchQuery)),
    [threads, searchQuery],
  );

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <ErrorMessages error={error} />;
  }

  return (
    <div className="flex flex-col gap-2 p-3">
      <h1 className="text-sm font-medium text-zinc-300">List Thread</h1>
      <div className="flex flex-col gap-2">
        {filteredThreads.length === 0 ? (
          <p className="text-sm text-zinc-500">
            {searchQuery.trim()
              ? "No conversations match your search."
              : "No conversations yet."}
          </p>
        ) : (
          filteredThreads.map((thread) => (
            <ThreadItem key={thread.id} thread={thread} onItemSelect={onItemSelect} />
          ))
        )}
      </div>
    </div>
  );
};
