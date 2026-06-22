import {
  CopilotChatAssistantMessage,
  type CopilotChatAssistantMessageProps,
} from "@copilotkit/react-core/v2";

import { ChatAgentAvatar } from "@/features/chat/components/sidebar/ChatAvatars";
import { cn } from "@/utils";

export const ChatAssistantMessage = ({
  className,
  toolbarVisible = false,
  ...props
}: CopilotChatAssistantMessageProps) => (
  <CopilotChatAssistantMessage
    {...props}
    toolbarVisible={toolbarVisible}
    className={cn("!bg-transparent !p-0", className)}
  >
    {({ markdownRenderer }) => (
      <div className="flex items-start gap-3 pt-4">
        <ChatAgentAvatar />
        <div className="chat-assistant-bubble max-w-[85%] rounded-2xl bg-zinc-800/80 px-4 py-3 text-sm leading-relaxed text-zinc-100">
          {markdownRenderer}
        </div>
      </div>
    )}
  </CopilotChatAssistantMessage>
);
