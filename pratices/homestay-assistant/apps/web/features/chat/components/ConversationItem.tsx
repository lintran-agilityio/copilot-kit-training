import type { ReactNode } from "react";

import { cn } from "@repo/utils";

type ConversationItemProps = {
  children: ReactNode;
  role: "user" | "assistant";
  className?: string;
  /**
   * Optional banner above the bubble body (e.g. blocked-message notice).
   */
  banner?: ReactNode;
};

/**
 * Chat conversation bubble — User / Assistant text only.
 * Tool UIs must use EmbeddedWidget instead.
 *
 * Layout chrome (alignment, horizontal padding) belongs on the timeline row.
 */
export const ConversationItem = ({
  children,
  role,
  className,
  banner,
}: ConversationItemProps) => {
  const isUser = role === "user";

  return (
    <div
      data-chat-conversation-item={role}
      data-chat-message-ui
      className={cn(
        "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
        isUser
          ? "bg-zinc-700/60 text-zinc-100"
          : "chat-assistant-bubble bg-zinc-800/80 text-zinc-100",
        className,
      )}
    >
      {banner}
      {children}
    </div>
  );
};
