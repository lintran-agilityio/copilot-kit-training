"use client";

import {
  CopilotChat,
  CopilotChatAssistantMessage,
  CopilotChatUserMessage,
} from "@copilotkit/react-core/v2";

import { ChatAssistantMessage } from "@/features/chat/components/sidebar/ChatAssistantMessage";
import { HeaderChat } from "@/features/chat/components/sidebar/HeaderChat";
import { ChatUserMessage } from "@/features/chat/components/sidebar/ChatUserMessage";
import { ChatWelcomeScreen } from "@/features/chat/components/sidebar/ChatWelcomeScreen";

import { WELCOME_MESSAGE } from "../../constants";
import { cn } from "@/utils";
import { CopilotSuggestion } from "@/components/suggestions/CopilotSuggestion";
import { useConfigureChatSuggestions } from "../../hooks";

type ChatSidebarProps = {
  className?: string;
  agentId: string;
};

export const ChatSidebar = ({ className, agentId }: ChatSidebarProps) => {
  useConfigureChatSuggestions({ agentId });

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
            className: "pointer-events-auto m-4",
          }}
          suggestionView={{
            suggestion: CopilotSuggestion,
            container: {
              className:
                "flex flex-wrap gap-2 pointer-events-auto",
            },
          }}
        />
      </div>
    </aside>
  );
};
