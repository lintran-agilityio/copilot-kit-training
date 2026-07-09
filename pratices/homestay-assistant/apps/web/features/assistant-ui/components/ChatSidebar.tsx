"use client";

import { ChatSidebarContent } from "@/features/assistant-ui/components/ChatSidebarContent";

export type ChatSidebarProps = {
  className?: string;
  agentId: string;
};

export const ChatSidebar = ({ className, agentId }: ChatSidebarProps) => {
  return <ChatSidebarContent className={className} agentId={agentId} />;
};
