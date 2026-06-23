import {
  CopilotChatAssistantMessage,
  type CopilotChatAssistantMessageProps,
} from "@copilotkit/react-core/v2";

import { ChatAgentAvatar } from "@/features/chat/components/sidebar/ChatAvatars";
import { getMessageTopSpacing } from "@/features/chat/utils";
import { cn } from "@repo/utils";;

export const ChatAssistantMessage = ({
  className,
  message,
  messages,
  toolbarVisible = false,
  ...props
}: CopilotChatAssistantMessageProps) => (
  <CopilotChatAssistantMessage
    {...props}
    message={message}
    messages={messages}
    toolbarVisible={toolbarVisible}
    className={cn("!bg-transparent !p-0", className)}
  >
    {({ markdownRenderer }) => (
      <div
        data-chat-message-row="assistant"
        className={cn(
          "flex items-start gap-3",
          getMessageTopSpacing(messages, message.id, "assistant"),
        )}
      >
        <ChatAgentAvatar />
        <div className="chat-assistant-bubble max-w-[85%] rounded-2xl bg-zinc-800/80 px-4 py-3 text-sm leading-relaxed text-zinc-100">
          {markdownRenderer}
        </div>
      </div>
    )}
  </CopilotChatAssistantMessage>
);
