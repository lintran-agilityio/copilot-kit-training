"use client";

import { useMemo } from "react";

import { ThreadItem } from "./ThreadItem";
import { Thread } from "@copilotkit/react-core/v2";

type ListThreadProps = {
  searchQuery?: string;
  threads: Thread[];
};

const matchesSearch = (name: string | null, query: string) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  return (name ?? "Untitled").toLowerCase().includes(normalizedQuery);
};

export const ListThread = ({
  threads,
  searchQuery = "",
}: ListThreadProps) => {
  const filteredThreads = useMemo(
    () => threads.filter((thread) => matchesSearch(thread.name, searchQuery)),
    [threads, searchQuery]
  );

  return (
    <div className="flex flex-col gap-2 p-3">
      {filteredThreads.length === 0 ? (
        <p className="text-sm text-zinc-500">
          {searchQuery.trim()
            ? "No conversations match your search."
            : "No conversations yet."}
        </p>
      ) : (
        filteredThreads.map((thread) => (
          <ThreadItem
            key={thread.id}
            thread={thread}
          />
        ))
      )}
    </div>
  );
};
