"use client";

import { useState } from "react";

import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";

import { ListThread } from "./ListThread";
import { NewChatButton } from "./NewChatButton";
import { SearchThreadButton } from "./SearchThreadButton";

type ThreadSidebarProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type SidebarContentProps = {
  onItemSelect: () => void;
};

const SidebarContent = ({ onItemSelect }: SidebarContentProps) => {
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
      <ListThread onItemSelect={onItemSelect} searchQuery={searchQuery} />
    </>
  );
};

export const ThreadSidebar = ({ open, onOpenChange }: ThreadSidebarProps) => {
  const onItemSelect = () => {
    onOpenChange(false);
  };

  return (
    // <Drawer direction="left" open={open} onOpenChange={onOpenChange}>
    //   <DrawerContent className="h-full w-72 max-w-[85vw] rounded-none border-r border-border bg-card p-0 text-card-foreground">
    //     <DrawerTitle className="sr-only">Conversations</DrawerTitle>
    //     <SidebarContent onItemSelect={onItemSelect} />
    //   </DrawerContent>
    // </Drawer>
    <aside className="flex h-full w-70 shrink-0 flex-col border-r border-border bg-card/70">
      <SidebarContent onItemSelect={onItemSelect} />
    </aside>
  );
};
