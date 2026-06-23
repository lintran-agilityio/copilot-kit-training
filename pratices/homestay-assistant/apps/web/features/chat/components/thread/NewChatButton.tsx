"use client";

import { MessageCircle } from "lucide-react";

import { useActiveThread } from "../../hooks";
import { useThreadContext } from "../../contexts/thread-context";

type NewChatButtonProps = {
  onNewChatClick: () => void;
};

export const NewChatButton = ({ onNewChatClick }: NewChatButtonProps) => {
  const { agentId } = useThreadContext();
  const { clearActiveThreadId } = useActiveThread(agentId);

  const handleClick = () => {
    clearActiveThreadId();
    onNewChatClick();
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-2">
      <button
        type="button"
        className="flex items-center gap-2 text-sm font-medium text-zinc-300"
        onClick={handleClick}
      >
        <MessageCircle className="size-4" aria-label="message-circle" />
        New Chat
      </button>
    </div>
  );
};
