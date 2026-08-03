"use client";

// Libs
import { XIcon } from "lucide-react";

// Internal
import { cn } from "@repo/utils";

// Features
import type { ChatIconStatus } from "@/features/chat/utils/chat-icon-status";
import {
  getChatToggleAriaLabel,
  renderClosedChatIcon,
  renderUnreadBadge,
} from "@/features/chat/utils/chat-toggle-button";

type ChatToggleButtonProps = {
  isChatOpen: boolean;
  status: ChatIconStatus;
  onToggle: () => void;
  className?: string;
};

/**
 * Chat sidebar toggle with closed-state status (unread / processing / typing / completed).
 * Closed: circular FAB over the room list (bottom-right).
 * Open: modal-style X close at the chat panel top-right.
 *
 * @param props - Open state, derived status, and toggle handler
 */
export const ChatToggleButton = ({
  isChatOpen,
  status,
  onToggle,
  className,
}: ChatToggleButtonProps) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isChatOpen}
      aria-label={getChatToggleAriaLabel(isChatOpen, status)}
      className={cn(
        "absolute z-30 flex items-center justify-center transition cursor-pointer",
        isChatOpen
          ? "top-2 right-2 size-8 rounded-md text-zinc-400 hover:bg-white/10 hover:text-white border-2 border-white/10"
          : "bottom-6 right-6 size-14 rounded-full border-2 border-emerald-500/90 bg-[#141414] text-zinc-300 shadow-lg hover:border-white/25 hover:bg-white/5 hover:text-white",
        className,
      )}
    >
      {isChatOpen ? (
        <XIcon className="size-4" aria-hidden />
      ) : (
        renderClosedChatIcon(status)
      )}
      {!isChatOpen ? renderUnreadBadge(status) : null}
    </button>
  );
};
