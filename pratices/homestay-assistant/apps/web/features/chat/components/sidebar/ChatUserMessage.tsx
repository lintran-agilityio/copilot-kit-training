"use client";

import {
  CopilotChatUserMessage,
  type CopilotChatUserMessageProps,
  useAgent,
  useCopilotChatConfiguration,
} from "@copilotkit/react-core/v2";

import { ChatUserAvatar } from "@/features/chat/components/sidebar/ChatAvatars";
import { getMessageTopSpacing } from "@/features/chat/utils";
import { cn } from "@repo/utils";;

export const ChatUserMessage = ({
  className,
  message,
  ...props
}: CopilotChatUserMessageProps) => {
  const agentId = useCopilotChatConfiguration()?.agentId;
  const { agent } = useAgent({ agentId });
  const topSpacing = getMessageTopSpacing(agent.messages, message.id, "user");

  return (
    <CopilotChatUserMessage
      {...props}
      message={message}
      className={cn("!bg-transparent !p-0", className)}
      messageRenderer={({ content }) => (
        <span className="whitespace-pre-wrap break-words">{content}</span>
      )}
    >
      {({ messageRenderer }) => (
        <div
          data-chat-message-row="user"
          className={cn("flex items-start justify-end gap-3", topSpacing)}
        >
          <div className="
            max-w-[85%]
            max-h-[400px]
            overflow-y-auto
            rounded-2xl
            bg-zinc-700/60
            px-4
            py-3
            text-sm
            leading-relaxed
            text-zinc-100
          ">
            {messageRenderer}
          </div>
          <ChatUserAvatar />
        </div>
      )}
    </CopilotChatUserMessage>
  );
};
