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
  isChatHeadlessMountTool,
  isHiddenAgentPrompt,
  isPageOnlyGenerativeTool,
} from "@/features/copilot/config";

import { ChatAgentAvatar } from "@/features/chat/components/ChatAvatars";
import { ConversationItem } from "@/features/chat/components/ConversationItem";

import {
  compareCompanionText,
  getAssistantDisplayContent,
  getMessageTopSpacing,
  messageHasRoomComparisonCall,
  turnRendersRoomComparison,
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

  // COMPARE turn: the RoomComparison A2UI surface owns every room fact, so the
  // chat line is replaced with a fixed short pointer — the model still
  // sometimes re-lists the rooms in text despite the prompt. The pointer
  // renders on the message that carried the `render_a2ui` call; any later
  // text-only message in the same turn (the model's re-listing) is dropped.
  const messagesForTurn = messages as Parameters<
    typeof turnRendersRoomComparison
  >[0];
  const messageRendersComparison = messageHasRoomComparisonCall(
    message as Parameters<typeof messageHasRoomComparisonCall>[0],
  );
  const inComparisonTurn = turnRendersRoomComparison(
    messagesForTurn,
    message.id,
  );

  if (inComparisonTurn && !messageRendersComparison && !chatToolCalls.length) {
    return null;
  }

  const textContent = messageRendersComparison
    ? compareCompanionText(messagesForTurn, message.id)
    : displayTextContent;

  const hasVisibleContent = Boolean(textContent) || chatToolCalls.length > 0;

  if (!hasVisibleContent && !hasHiddenToolCalls) {
    return null;
  }

  const hasConversation = Boolean(textContent);

  // Headless bridge tools (cancel/update/create_booking notices) always
  // render null — they must still mount (their useEffect drives the HITL
  // card store + cache invalidation) but must not claim an avatar row.
  const visibleWidgetToolCalls = chatToolCalls.filter(
    (toolCall) => !isChatHeadlessMountTool(toolCall.function?.name),
  );
  const hasWidgets = visibleWidgetToolCalls.length > 0;
  // Use the raw tool-call count, not chatToolCalls.length: a turn made up
  // entirely of page-only tools (e.g. find_booking_by_id, resolve-only
  // lookups) is filtered out of chatToolCalls by isPageOnlyGenerativeTool
  // before it ever reaches here, so chatToolCalls.length would read 0 and
  // this turn would wrongly fall through to the normal avatar row — an
  // empty tool-content div CSS can't always be relied on to collapse.
  const isHeadlessOnlyTurn =
    Boolean(message.toolCalls?.length) && !hasWidgets && !hasConversation;

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
      {({ markdownRenderer, toolCallsView }) =>
        isHeadlessOnlyTurn ? (
          // Only a headless bridge tool (cancel/update/create_booking notice)
          // fired this turn — mount it so its side effects run, but claim no
          // timeline space: no avatar row, no top spacing.
          <div hidden aria-hidden data-chat-timeline-entry="assistant-headless">
            {toolCallsView}
          </div>
        ) : (
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
        )
      }
    </CopilotChatAssistantMessage>
  );
};
