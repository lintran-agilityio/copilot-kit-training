"use client";

import { cn } from "@repo/utils";

import { useActiveThread } from "../../hooks";
import { ChatDraftPanel } from "./ChatDraftPanel";
import { ChatSidebarContent } from "./ChatSidebarContent";

export type ChatSidebarProps = {
  className?: string;
  agentId: string;
};

export const ChatSidebar = ({ className, agentId }: ChatSidebarProps) => {
  const { activeThreadId } = useActiveThread(agentId);

  if (!activeThreadId) {
    return <ChatDraftPanel className={className} agentId={agentId} />;
  }

  return (
    <ChatSidebarContent
      className={className}
      agentId={agentId}
      threadId={activeThreadId}
    />
  );
};
