"use client";

import { ErrorMessages, Loading } from "@repo/components";
import { useThreadContext } from "../../contexts/thread-context";
import { SidebarContent } from "./SidebarContent";

type ThreadSidebarProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const ThreadSidebar = ({
  open,
  onOpenChange,
}: ThreadSidebarProps) => {
  const { threads, isLoading, error } = useThreadContext();
  const onItemSelect = () => {
    onOpenChange(false);
  };

  return (
    <aside className="flex h-full w-70 shrink-0 flex-col border-r border-border bg-card/70">
      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorMessages error={error} />
      ) : (
        <SidebarContent
          threads={threads ?? []}
          onItemSelect={onItemSelect}
        />
      )}
    </aside>
  );
};
