import {
  CopilotChatUserMessage,
  type CopilotChatUserMessageProps,
} from "@copilotkit/react-core/v2";

import { ChatUserAvatar } from "@/components/chat/ChatAvatars";
import { cn } from "@/lib/utils";

export const ChatUserMessage = ({
  className,
  ...props
}: CopilotChatUserMessageProps) => (
  <CopilotChatUserMessage
    {...props}
    className={cn("!bg-transparent !p-0 !pt-4", className)}
  >
    {({ messageRenderer }) => (
      <div className="flex items-start justify-end gap-3">
        <div className="max-w-[85%] rounded-2xl bg-zinc-700/60 px-4 py-3 text-sm leading-relaxed text-zinc-100">
          {messageRenderer}
        </div>
        <ChatUserAvatar />
      </div>
    )}
  </CopilotChatUserMessage>
);
