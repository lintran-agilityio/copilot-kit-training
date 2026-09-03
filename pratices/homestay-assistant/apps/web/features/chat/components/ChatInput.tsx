"use client";

import { createContext, forwardRef, useContext, type ComponentProps } from "react";
import {
  CopilotChatInput,
  type CopilotChatInputProps,
} from "@copilotkit/react-core/v2";

import { cn } from "@repo/utils";
import { useChatStore } from "@/features/chat/stores/chat-store";
import { shouldBlockChatSendKeyDown, rejectIfAgentRunning } from "@/features/chat/utils";

const ChatInputRunningContext = createContext(false);

const GuardedTextArea = forwardRef<
  HTMLTextAreaElement,
  ComponentProps<typeof CopilotChatInput.TextArea>
>(function GuardedTextArea({ onKeyDown, ...props }, ref) {
  const isRunning = useContext(ChatInputRunningContext);

  return (
    <CopilotChatInput.TextArea
      {...props}
      ref={ref}
      onKeyDown={(event) => {
        if (
          shouldBlockChatSendKeyDown({
            key: event.key,
            shiftKey: event.shiftKey,
            isComposing: event.nativeEvent.isComposing,
            isRunning,
          })
        ) {
          event.preventDefault();
          rejectIfAgentRunning(true);
          return;
        }

        onKeyDown?.(event);
      }}
    />
  );
});

/**
 * Chat composer: Stop stays available while the agent runs; Send / Enter
 * cannot start a second request. A blocked submit surfaces the busy error.
 */
export const ChatInput = ({
  isRunning = false,
  onSubmitMessage,
  className,
  ...props
}: CopilotChatInputProps) => {
  const handleSubmit = (value: string) => {
    if (rejectIfAgentRunning(isRunning)) {
      return;
    }

    useChatStore.getState().clearActionError();
    onSubmitMessage?.(value);
  };

  return (
    <ChatInputRunningContext.Provider value={isRunning}>
      <CopilotChatInput
        {...props}
        isRunning={isRunning}
        onSubmitMessage={handleSubmit}
        textArea={GuardedTextArea}
        showDisclaimer={false}
        bottomAnchored={false}
        className={cn("pointer-events-auto m-4 mt-0 rounded-2xl", className)}
      />
    </ChatInputRunningContext.Provider>
  );
};
