import {
  CopilotChatAssistantMessage,
  CopilotChatToolCallsView,
  type CopilotChatAssistantMessageProps,
  type CopilotChatToolCallsViewProps,
} from "@copilotkit/react-core/v2";

import { ChatAgentAvatar } from "@/features/chat/components/sidebar/ChatAvatars";
import {
  getChatVisibleToolCalls,
  getMessageTextContent,
  isHiddenAgentPrompt,
} from "@/features/copilot/constants/page-generative-ui";
import { getMessageTopSpacing } from "@/features/chat/utils";
import { cn } from "@repo/utils";;

const isResponseToHiddenPrompt = (
  messages: CopilotChatAssistantMessageProps["messages"],
  messageId: string,
) => {
  const index = messages?.findIndex((item) => item.id === messageId) ?? -1;
  if (index <= 0 || !messages) {
    return false;
  }

  const previousMessage = messages[index - 1];
  if (previousMessage?.role !== "user") {
    return false;
  }

  return isHiddenAgentPrompt(
    getMessageTextContent(
      previousMessage.content as
        | string
        | Array<{ type: string; text?: string }>,
    ),
  );
};

const ChatToolCallsView = ({
  message,
  messages,
}: CopilotChatToolCallsViewProps) => {
  const visibleToolCalls = getChatVisibleToolCalls(message.toolCalls);

  if (!visibleToolCalls.length) {
    return null;
  }

  return (
    <CopilotChatToolCallsView
      message={{ ...message, toolCalls: visibleToolCalls }}
      messages={messages}
    />
  );
};

export const ChatAssistantMessage = ({
  className,
  message,
  messages,
  toolbarVisible = false,
  ...props
}: CopilotChatAssistantMessageProps) => {
  if (isResponseToHiddenPrompt(messages, message.id)) {
    return null;
  }

  const chatToolCalls = getChatVisibleToolCalls(message.toolCalls);
  const hasVisibleContent =
    Boolean(message.content?.trim()) || chatToolCalls.length > 0;

  if (!hasVisibleContent) {
    return null;
  }

  return (
    <CopilotChatAssistantMessage
      {...props}
      message={message}
      messages={messages}
      toolbarVisible={toolbarVisible}
      className={cn("!bg-transparent !p-0", className)}
      toolCallsView={ChatToolCallsView}
    >
      {({ markdownRenderer, toolCallsView }) => (
        <div
          data-chat-message-row="assistant"
          className={cn(
            "flex items-start gap-3",
            getMessageTopSpacing(messages, message.id, "assistant"),
          )}
        >
          <ChatAgentAvatar />
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            {markdownRenderer ? (
              <div className="chat-assistant-bubble max-w-[85%] rounded-2xl bg-zinc-800/80 px-4 py-3 text-sm leading-relaxed text-zinc-100">
                {markdownRenderer}
              </div>
            ) : null}
            {toolCallsView}
          </div>
        </div>
      )}
    </CopilotChatAssistantMessage>
  );
};
