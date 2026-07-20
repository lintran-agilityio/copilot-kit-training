"use client";

import { useEffect, useRef, useState } from "react";
import {
  CopilotChat,
  CopilotChatAssistantMessage,
  CopilotChatUserMessage,
  useAgent,
  useCopilotKit,
} from "@copilotkit/react-core/v2";

import { cn } from "@repo/utils";
import { WELCOME_MESSAGE } from "@/features/assistant-ui/constants";
import {
  useChatSuggestions,
  useChatScroll,
  useChatScopeKey,
  useThreadMessages,
} from "@/features/assistant-ui/hooks";
import {
  HeaderChat,
  ChatUserMessage,
  ChatWelcomeScreen,
  ChatAssistantMessage,
} from "@/features/assistant-ui/components";
import { useChatStore } from "@/features/assistant-ui/stores/chat-store";
import { ChatSidebarProps } from "@/features/assistant-ui/components/ChatSidebar";
import { SuggestionBar } from "@/components/suggestions";

export const ChatSidebarContent = ({
  className,
  agentId,
}: ChatSidebarProps) => {
  const suggestions = useChatSuggestions({ agentId });
  const { scopeKey } = useChatScopeKey(agentId);
  const currentThreadId = useChatStore((state) =>
    scopeKey ? state.currentThreadIds[scopeKey] : undefined,
  );
  const consumePendingOutboundMessage = useChatStore(
    (state) => state.consumePendingOutboundMessage,
  );
  const { copilotkit } = useCopilotKit();
  const { agent } = useAgent({ agentId });
  const [hasHydrated, setHasHydrated] = useState(false);
  const agentRef = useRef(agent);
  const copilotkitRef = useRef(copilotkit);
  const wasRuntimeConnectedRef = useRef(
    copilotkit.runtimeConnectionStatus === "connected",
  );
  agentRef.current = agent;
  copilotkitRef.current = copilotkit;

  const isRuntimeConnected =
    copilotkit.runtimeConnectionStatus === "connected";
  const displayedOnlineStatus = hasHydrated && isRuntimeConnected;

  const contentKey = agent.messages
    .map((message) => {
      const contentLength =
        typeof message.content === "string"
          ? message.content.length
          : Array.isArray(message.content)
            ? message.content.length
            : 0;
      const toolKey =
        "toolCalls" in message && Array.isArray(message.toolCalls)
          ? message.toolCalls
              .map(
                (toolCall) =>
                  `${toolCall.id}:${toolCall.function?.arguments?.length ?? 0}`,
              )
              .join(",")
          : "";
      return `${message.id}:${contentLength}:${toolKey}`;
    })
    .join("|");

  useChatScroll({
    messageCount: agent.messages.length,
    isRunning: agent.isRunning,
    contentKey,
  });
  useThreadMessages({ agent, agentId, threadId: currentThreadId });

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (currentThreadId) {
      agent.threadId = currentThreadId;
    }
  }, [agent, currentThreadId]);

  const sendPendingMessageRef = useRef<(() => Promise<void>) | undefined>(
    undefined,
  );

  sendPendingMessageRef.current = async () => {
    if (
      !scopeKey ||
      !currentThreadId ||
      copilotkitRef.current.runtimeConnectionStatus !== "connected"
    ) {
      return;
    }

    const pendingMessage = consumePendingOutboundMessage(scopeKey);
    if (!pendingMessage) {
      return;
    }

    const currentAgent = agentRef.current;
    const currentCopilotkit = copilotkitRef.current;
    currentAgent.threadId = currentThreadId;

    currentAgent.addMessage({
      id: crypto.randomUUID(),
      role: "user",
      content: pendingMessage,
    });

    try {
      await currentCopilotkit.runAgent({ agent: currentAgent });
    } catch (error) {
      console.error("Failed to send pending message", error);
    }
  };

  useEffect(() => {
    const wasConnected = wasRuntimeConnectedRef.current;
    wasRuntimeConnectedRef.current = isRuntimeConnected;

    if (!isRuntimeConnected || wasConnected) {
      return;
    }

    sendPendingMessageRef.current?.();
  }, [isRuntimeConnected, scopeKey]);

  const suggestionBar = (
    <SuggestionBar
      suggestions={suggestions}
      agentId={agentId}
      threadId={currentThreadId}
    />
  );

  return (
    <aside
      className={cn(
        "flex h-full w-full flex-col border-l border-white/10 bg-[#0a0a0a]",
        className,
      )}
    >
      <HeaderChat online={displayedOnlineStatus} />
      <div
        data-sidebar-chat
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
          "[&_.copilotKitChat]:flex [&_.copilotKitChat]:h-full [&_.copilotKitChat]:min-h-0 [&_.copilotKitChat]:flex-col",
        )}
      >
        <CopilotChat
          agentId={agentId}
          threadId={currentThreadId}
          autoScroll="pin-to-bottom"
          className="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
          // CopilotChat always injects autoSuggestions into scrollView when the
          // chat has messages. Hide that built-in strip — we render SuggestionBar
          // once in the footer (and on the welcome screen).
          scrollView={{
            className:
              "app-scrollbar min-h-0 flex-1 [&_[data-testid=copilot-suggestions]]:hidden",
          }}
          labels={{
            chatInputPlaceholder: "Ask me anything...",
            welcomeMessageText: WELCOME_MESSAGE,
          }}
          welcomeScreen={(props) => (
            <ChatWelcomeScreen {...props} suggestionView={suggestionBar} />
          )}
          messageView={{
            className: "px-0 mx-0",
            assistantMessage:
              ChatAssistantMessage as typeof CopilotChatAssistantMessage,
            userMessage: ChatUserMessage as typeof CopilotChatUserMessage,
          }}
          input={{
            showDisclaimer: false,
            bottomAnchored: true,
            className: "pointer-events-auto m-4 mt-0",
          }}
        >
          {({ scrollView, input }) => (
            <div
              data-testid="copilot-chat"
              className="copilotKitChat flex h-full min-h-0 flex-1 flex-col overflow-hidden"
            >
              <div
                data-chat-messages
                className="flex min-h-0 flex-1 flex-col overflow-hidden"
              >
                {scrollView}
                <div data-chat-bottom aria-hidden="true" className="hidden" />
              </div>
              <div
                data-chat-footer
                className="shrink-0 border-t border-white/5 bg-[#0a0a0a]"
              >
                {suggestionBar}
                {input}
              </div>
            </div>
          )}
        </CopilotChat>
      </div>
    </aside>
  );
};
