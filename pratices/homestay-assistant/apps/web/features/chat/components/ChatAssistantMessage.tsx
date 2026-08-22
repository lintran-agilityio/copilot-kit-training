import {
  CopilotChatAssistantMessage,
  CopilotChatToolCallsView,
  type CopilotChatAssistantMessageProps,
  type CopilotChatToolCallsViewProps,
} from "@copilotkit/react-core/v2";

import {
  MESSAGE_ROLE,
  isProcessorBlockAssistantContent,
} from "@repo/constants";

import {
  getChatVisibleToolCalls,
  getMessageTextContent,
  isHiddenAgentPrompt,
  isPageOnlyGenerativeTool,
} from "@/features/copilot/config";

import { ChatAgentAvatar } from "@/features/chat/components/ChatAvatars";
import { ConversationItem } from "@/features/chat/components/ConversationItem";

import {
  getAssistantDisplayContent,
  getMessageTopSpacing,
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

  if (previousMessage?.role !== MESSAGE_ROLE.USER) {
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
  const visibleToolCalls = getChatVisibleToolCalls(message.toolCalls, messages);

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

  const chatToolCalls = getChatVisibleToolCalls(message.toolCalls, messages);

  const rawTextContent = getMessageTextContent(message.content).trim();
  const displayTextContent = isProcessorBlockAssistantContent(message.content)
    ? getAssistantDisplayContent(message.content).trim()
    : rawTextContent;

  const hasHiddenToolCalls = message.toolCalls?.some((toolCall) => {
    const toolName = toolCall.function?.name;

    return toolName ? isPageOnlyGenerativeTool(toolName) : false;
  });

  const textContent = displayTextContent;

  const hasVisibleContent = Boolean(textContent) || chatToolCalls.length > 0;

  if (!hasVisibleContent && !hasHiddenToolCalls) {
    return null;
  }

  const hasConversation = Boolean(textContent);

  const hasWidgets = chatToolCalls.length > 0;

  const displayMessage =
    textContent && textContent !== rawTextContent
      ? { ...message, content: textContent }
      : message;

  return (
    <CopilotChatAssistantMessage
      {...props}
      message={displayMessage}
      messages={messages}
      toolbarVisible={toolbarVisible}
      className={cn("!bg-transparent p-0", className)}
      toolCallsView={ChatToolCallsView}
    >
      {({ markdownRenderer, toolCallsView }) => (
        <div
          data-chat-timeline-entry="assistant"
          className={cn(
            "flex flex-col gap-2.5",

            getMessageTopSpacing(messages, message.id, "assistant", {
              widgetOnly: hasWidgets && !hasConversation,
            }),
          )}
        >
          {toolCallsView ? (
            hasConversation ? (
              <div data-chat-embedded-slot className="w-full">
                {toolCallsView}
              </div>
            ) : (
              <div
                data-chat-embedded-slot
                data-chat-message-row="assistant"
                data-chat-tool-only-row
                className="flex items-start justify-start gap-3 px-3"
              >
                <ChatAgentAvatar />
                <div data-chat-tool-content className="min-w-0 flex-1">
                  {toolCallsView}
                </div>
              </div>
            )
          ) : null}

          {hasConversation && markdownRenderer ? (
            <div
              data-chat-message-row="assistant"
              className="flex items-start justify-start gap-3 px-3"
            >
              <ChatAgentAvatar />
              <ConversationItem role="assistant">
                {markdownRenderer}
              </ConversationItem>
            </div>
          ) : null}
        </div>
      )}
    </CopilotChatAssistantMessage>
  );
};
