"use client";

import { useThreadContext } from "../stores/threadContext"; 
import { Loading, ErrorMessages } from "@repo/components";
import { ThreadItem } from "./ThreadItem";

type ListThreadProps = {
  onItemSelect: () => void;
};

export const ListThread = ({ onItemSelect }: ListThreadProps) => {
  const {
    isLoading,
    error,
    threads,
  } = useThreadContext();

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <ErrorMessages error={error} />;
  }

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-sm font-medium text-zinc-300">List Thread</h1>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2">
            {threads.map((thread) => (
              <ThreadItem key={thread.id} thread={thread} onItemSelect={onItemSelect} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
