"use client";

import { ChatSidebarContent } from "@/features/chat/components/ChatSidebarContent";
import { DynamicSuggestionConfig } from "@/features/chat/components/DynamicSuggestionConfig";

export type ChatSidebarProps = {
  className?: string;
  agentId: string;
};

export const ChatSidebar = ({ className, agentId }: ChatSidebarProps) => {
  return (
    <>
      <DynamicSuggestionConfig agentId={agentId} />
      <ChatSidebarContent className={className} agentId={agentId} />
    </>
  );
};
