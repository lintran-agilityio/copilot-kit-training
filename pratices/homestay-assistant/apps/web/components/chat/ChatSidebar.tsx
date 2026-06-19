"use client";

import { forwardRef } from "react";
import {
  CopilotChat,
  CopilotChatAssistantMessage,
  CopilotChatSuggestionPill,
  CopilotChatUserMessage,
  type CopilotChatSuggestionPillProps,
  useConfigureSuggestions,
} from "@copilotkit/react-core/v2";

import { ChatAssistantMessage } from "@/components/chat/ChatAssistantMessage";
import { HeaderChat } from "@/components/chat/HeaderChat";
import { ChatUserMessage } from "@/components/chat/ChatUserMessage";
import { ChatWelcomeScreen } from "@/components/chat/ChatWelcomeScreen";
import { cn } from "@/lib/utils";

const CHAT_SUGGESTIONS = [
  { title: "Room for 4 people", message: "Find a room for 4 people today" },
  { title: "Need a quiet space", message: "I need a quiet space for focused work" },
  { title: "Rooms with video", message: "Show me rooms with video conferencing" },
  {
    title: "What's available today?",
    message: "What rooms are available today?",
  },
];

const WELCOME_MESSAGE =
  "Hi! I'm your room booking assistant. Tell me what you need — number of people, preferred time, or type of space — and I'll find the right room for you.";

const StyledSuggestionPill = forwardRef<
  HTMLButtonElement,
  CopilotChatSuggestionPillProps
>(function StyledSuggestionPill({ className, ...props }, ref) {
  return (
    <CopilotChatSuggestionPill
      {...props}
      ref={ref}
      className={cn(
        "rounded-full border border-white/15 bg-transparent px-3 py-1.5 text-xs text-zinc-300 hover:border-[#E6C547]/40 hover:bg-[#E6C547]/10 hover:text-white",
        className,
      )}
    />
  );
});

type ChatSidebarProps = {
  className?: string;
  agentId: string;
};

export const ChatSidebar = ({ className, agentId }: ChatSidebarProps) => {
  useConfigureSuggestions(
    {
      suggestions: CHAT_SUGGESTIONS,
      available: "always",
    },
    [],
  );

  return (
    <aside
      className={cn(
        "flex h-full w-full flex-col border-l border-white/10 bg-[#0a0a0a]",
        className,
      )}
    >
      <HeaderChat />

      <div
        data-sidebar-chat
        className="flex min-h-0 flex-1 flex-col [&_.copilotKitChat]:h-full [&_.copilotKitChat]:bg-transparent"
      >
        <CopilotChat
          agentId={agentId}
          className="flex h-full flex-col pt-4"
          labels={{
            chatInputPlaceholder: "Ask me anything...",
            welcomeMessageText: WELCOME_MESSAGE,
          }}
          welcomeScreen={ChatWelcomeScreen}
          messageView={{
            className: "px-4",
            assistantMessage:
              ChatAssistantMessage as typeof CopilotChatAssistantMessage,
            userMessage: ChatUserMessage as typeof CopilotChatUserMessage,
          }}
          input={{
            showDisclaimer: false,
            bottomAnchored: true,
            className: "pointer-events-auto w-full mb-4 mt-4",
          }}
          suggestionView={{
            suggestion: StyledSuggestionPill,
            container: {
              className:
                "flex flex-wrap gap-2 pointer-events-auto px-2",
            },
          }}
        />
      </div>
    </aside>
  );
};
