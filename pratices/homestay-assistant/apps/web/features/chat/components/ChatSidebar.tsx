"use client";

import { ChatSidebarContent } from "@/features/chat/components/ChatSidebarContent";

export type ChatSidebarProps = {
  className?: string;
  agentId: string;
};

export const ChatSidebar = ({ className, agentId }: ChatSidebarProps) => {
  return <ChatSidebarContent className={className} agentId={agentId} />;
};
