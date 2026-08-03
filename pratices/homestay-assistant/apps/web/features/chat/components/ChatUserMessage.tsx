"use client";



import {

  CopilotChatUserMessage,

  type CopilotChatUserMessageProps,

  useAgent,

  useCopilotChatConfiguration,

} from "@copilotkit/react-core/v2";



import { ConversationItem } from "@/features/chat/components/ConversationItem";

import { getMessageTopSpacing } from "@/features/chat/utils";

import { isBlockedMessageMetadata } from "@repo/constants";

import { cn } from "@repo/utils";

import {

  getMessageTextContent,

  getUserVisibleMessageContent,

  isHiddenAgentPrompt,

} from "@/features/copilot/config";



export const ChatUserMessage = ({

  className,

  message,

  ...props

}: CopilotChatUserMessageProps) => {

  const agentId = useCopilotChatConfiguration()?.agentId;

  const { agent } = useAgent({ agentId });

  const topSpacing = getMessageTopSpacing(agent.messages, message.id, "user");



  const rawContent = getMessageTextContent(message.content);



  if (isHiddenAgentPrompt(rawContent)) {

    return null;

  }



  const displayContent = getUserVisibleMessageContent(rawContent);

  const isBlocked = isBlockedMessageMetadata(

    (message as { metadata?: unknown }).metadata,

  );



  return (

    <CopilotChatUserMessage

      {...props}

      message={message}

      className={cn("!bg-transparent !p-0", className)}

      messageRenderer={() => (

        <span className="whitespace-pre-wrap break-words">{displayContent}</span>

      )}

    >

      {({ messageRenderer }) => (

        <div

          data-chat-timeline-entry="user"

          data-chat-message-row="user"

          className={cn("flex items-start justify-end px-3", topSpacing)}

        >

          <ConversationItem

            role="user"

            className={cn(

              "app-scrollbar max-h-[400px] overflow-y-auto",

              isBlocked &&

                "border border-amber-500/40 bg-amber-950/40 text-amber-50",

            )}

            banner={

              isBlocked ? (

                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-amber-300/90">

                  Blocked by security filter

                </p>

              ) : null

            }

          >

            {messageRenderer}

          </ConversationItem>

        </div>

      )}

    </CopilotChatUserMessage>

  );

};

