"use client";

import { useState } from "react";

import { ListThread } from "./ListThread";
import { NewChatButton } from "./NewChatButton";
import { SearchThreadButton } from "./SearchThreadButton";
import { Thread } from "@copilotkit/react-core/v2";

type SidebarContentProps = {
  threads: Thread[];
  onItemSelect: () => void;
};

export const SidebarContent = ({
  threads,
  onItemSelect,
}: SidebarContentProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <>
      <div className="flex flex-col gap-2 border-b border-border p-3">
        <NewChatButton onNewChatClick={onItemSelect} />
        <SearchThreadButton
          value={searchQuery}
          onChange={setSearchQuery}
          isOpen={isSearchOpen}
          onOpenChange={setIsSearchOpen}
        />
      </div>
      <ListThread
        threads={threads ?? []}
        searchQuery={searchQuery}
      />
    </>
  );
};
