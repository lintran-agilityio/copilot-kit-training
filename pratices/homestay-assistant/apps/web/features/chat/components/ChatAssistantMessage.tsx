import {
  CopilotChatAssistantMessage,
  CopilotChatToolCallsView,
  type CopilotChatAssistantMessageProps,
  type CopilotChatToolCallsViewProps,
} from "@copilotkit/react-core/v2";

import {
  getChatVisibleToolCalls,
  getMessageTextContent,
  isHiddenAgentPrompt,
  isPageOnlyGenerativeTool,
} from "@/features/copilot/config";
import {
  getMessageTopSpacing,
  isSupersededByToolCard,
} from "@/features/chat/utils";
import { cn } from "@repo/utils";

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
  const rawTextContent = message.content?.trim() ?? "";
  const hasHiddenToolCalls = message.toolCalls?.some((toolCall) => {
    const toolName = toolCall.function?.name;
    return toolName ? isPageOnlyGenerativeTool(toolName) : false;
  });

  // A rendered success card already answers the guest; drop the duplicate text.
  const textContent = isSupersededByToolCard(messages, message.id)
    ? ""
    : rawTextContent;

  const hasVisibleContent =
    Boolean(textContent) || chatToolCalls.length > 0;

  if (!hasVisibleContent && !hasHiddenToolCalls) {
    return null;
  }

  return (
    <CopilotChatAssistantMessage
      {...props}
      message={message}
      messages={messages}
      toolbarVisible={toolbarVisible}
      className={cn("!bg-transparent p-0", className)}
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
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            {textContent && markdownRenderer ? (
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
