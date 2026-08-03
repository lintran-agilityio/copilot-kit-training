"use client";

import type { HTMLAttributes } from "react";
import {
  useAgent,
  useCopilotChatConfiguration,
} from "@copilotkit/react-core/v2";

import { ChatAgentAvatar } from "@/features/chat/components/ChatAvatars";
import { ConversationItem } from "@/features/chat/components/ConversationItem";
import { getMessageTextContent } from "@/features/copilot/config";
import { cn } from "@repo/utils";

const hasVisibleAssistantText = (message: {
  role?: string;
  content?: unknown;
}) => {
  if (message.role !== "assistant") {
    return false;
  }

  return Boolean(getMessageTextContent(message.content).trim());
};

/**
 * Agent-running indicator for the CopilotChat message list `cursor` slot.
 * Replaces CopilotKit's default single pulse dot with an assistant-style typing row.
 * Hidden once the latest assistant message already has visible text (streaming).
 *
 * Always returns an Element (never null) — CopilotChat's cursor slot requires that.
 */
export const ChatLoadingCursor = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  const agentId = useCopilotChatConfiguration()?.agentId;
  const { agent } = useAgent({ agentId });
  const lastMessage = agent.messages.at(-1);

  if (lastMessage && hasVisibleAssistantText(lastMessage)) {
    return <div hidden aria-hidden {...props} />;
  }

  return (
    <div
      {...props}
      data-testid="copilot-loading-cursor"
      data-chat-timeline-entry="assistant-loading"
      role="status"
      aria-live="polite"
      aria-label="Assistant is responding"
      className={cn(
        "flex items-start justify-start gap-3 px-3 pb-1",
        className,
      )}
    >
      <ChatAgentAvatar />
      <ConversationItem
        role="assistant"
        className="flex min-h-9 items-center gap-1.5 py-3"
      >
        <span className="sr-only">Assistant is responding</span>
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            aria-hidden
            className="size-1.5 rounded-full bg-zinc-400 animate-bounce"
            style={{ animationDelay: `${index * 150}ms` }}
          />
        ))}
      </ConversationItem>
    </div>
  );
};
