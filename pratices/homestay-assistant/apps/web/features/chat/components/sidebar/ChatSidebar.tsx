"use client";

import { ChatSidebarContent } from "./ChatSidebarContent";

export type ChatSidebarProps = {
  className?: string;
  agentId: string;
};

export const ChatSidebar = ({ className, agentId }: ChatSidebarProps) => {
  return <ChatSidebarContent className={className} agentId={agentId} />;
};
